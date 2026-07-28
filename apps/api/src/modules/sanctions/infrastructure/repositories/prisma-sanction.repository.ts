import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { Sanction } from '../../domain/entities/sanction.entity';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { SanctionStatus, SanctionSeverity } from '@prisma/client';

@Injectable()
export class PrismaSanctionRepository implements ISanctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(data: any): Sanction {
    return Sanction.create({
      id: data.id,
      associationId: data.associationId,
      memberId: data.memberId,
      caisseId: data.caisseId,
      title: data.title,
      reason: data.reason,
      fineAmount: data.fineAmount,
      status: data.status as SanctionStatus,
      severity: data.severity as SanctionSeverity,
      issuedByUserId: data.issuedByUserId,
      paidAt: data.paidAt,
      transactionId: data.transactionId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    return assoc ? assoc.id : null;
  }

  async createSanction(sanction: Sanction): Promise<void> {
    const data = sanction.toJSON();
    const assocId = await this.resolveAssociationId(data.associationId) || data.associationId;

    await this.prisma.sanction.create({
      data: {
        id: data.id,
        associationId: assocId,
        memberId: data.memberId,
        caisseId: data.caisseId,
        title: data.title,
        reason: data.reason,
        fineAmount: data.fineAmount,
        status: data.status,
        severity: data.severity,
        issuedByUserId: data.issuedByUserId,
        paidAt: data.paidAt,
        transactionId: data.transactionId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async updateSanction(sanction: Sanction): Promise<void> {
    const data = sanction.toJSON();
    await this.prisma.sanction.update({
      where: { id: data.id },
      data: {
        caisseId: data.caisseId,
        status: data.status,
        paidAt: data.paidAt,
        transactionId: data.transactionId,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Sanction | null> {
    const data = await this.prisma.sanction.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async listByAssociation(associationId: string, status?: SanctionStatus): Promise<Sanction[]> {
    const assocId = await this.resolveAssociationId(associationId) || associationId;
    const where: any = { associationId: assocId };
    if (status) where.status = status;

    const data = await this.prisma.sanction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async listByMember(memberId: string): Promise<Sanction[]> {
    const data = await this.prisma.sanction.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async listAllByStatus(status: SanctionStatus): Promise<Sanction[]> {
    const data = await this.prisma.sanction.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  // ACID transaction for fine payment (increments caisse, creates deposit transaction, updates sanction status atomically)
  async paySanctionAtomic(
    sanctionId: string,
    caisseId: string,
    paidByUserId?: string,
    associationId?: string,
  ): Promise<Sanction> {
    const assocIdResolved = associationId ? await this.resolveAssociationId(associationId) : null;

    return this.prisma.$transaction(async (tx: any) => {
      const rawSanction = await tx.sanction.findUnique({
        where: { id: sanctionId },
      });

      if (!rawSanction) {
        throw new Error(`Sanction avec l'ID "${sanctionId}" introuvable`);
      }
      if (rawSanction.status !== SanctionStatus.PENDING) {
        throw new Error(`Seules les sanctions en attente de paiement peuvent être réglées`);
      }
      if (rawSanction.fineAmount <= 0) {
        throw new Error(`Cette sanction ne comporte pas d'amende financière`);
      }

      const assocId = assocIdResolved || rawSanction.associationId;

      // 1. Increment caisse balance
      await tx.caisse.update({
        where: { id: caisseId },
        data: {
          balance: { increment: rawSanction.fineAmount },
          updatedAt: new Date(),
        },
      });

      // 2. Create treasury deposit transaction
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const refSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const reference = `FIN-${dateStr}-${refSuffix}`;

      const treasuryTx = await tx.transaction.create({
        data: {
          id: `tx-fine-${rawSanction.id}`,
          associationId: assocId,
          caisseId,
          type: 'DEPOSIT',
          amount: rawSanction.fineAmount,
          reference,
          description: `Règlement amende: ${rawSanction.title}`,
          memberId: rawSanction.memberId,
          status: 'CONFIRMED',
          createdByUserId: paidByUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 3. Update sanction status to PAID
      const updatedSanction = await tx.sanction.update({
        where: { id: rawSanction.id },
        data: {
          status: SanctionStatus.PAID,
          caisseId,
          transactionId: treasuryTx.id,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return this.mapToEntity(updatedSanction);
    });
  }
}

