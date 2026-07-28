import { Inject, Injectable } from '@nestjs/common';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { SanctionStatus } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface ListSanctionsQuery {
  associationId: string;
  status?: SanctionStatus;
}

@Injectable()
export class ListSanctionsUseCase {
  constructor(
    @Inject('ISanctionRepository') private readonly sanctionRepo: ISanctionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListSanctionsQuery) {
    const assocId = await this.sanctionRepo.resolveAssociationId(query.associationId);
    if (!assocId) return [];

    const where: any = { associationId: assocId };
    if (query.status) where.status = query.status;

    const sanctions = await this.prisma.sanction.findMany({
      where,
      include: {
        member: {
          include: {
            user: { select: { email: true, phone: true } },
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        caisse: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sanctions;
  }
}
