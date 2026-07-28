import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { Loan } from '../../domain/entities/loan.entity';
import { ILoanRepository, CreateRepaymentData } from '../../domain/repositories/loan.repository.interface';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class PrismaLoanRepository implements ILoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(data: any): Loan {
    return Loan.create({
      id: data.id,
      associationId: data.associationId,
      borrowerMemberId: data.borrowerMemberId,
      guarantorMemberId: data.guarantorMemberId,
      caisseId: data.caisseId,
      amount: data.amount,
      interestRate: data.interestRate,
      dailyPenaltyRate: data.dailyPenaltyRate,
      totalToRepay: data.totalToRepay,
      balanceRemaining: data.balanceRemaining,
      status: data.status as LoanStatus,
      reason: data.reason,
      startDate: data.startDate,
      dueDate: data.dueDate,
      approvedByUserId: data.approvedByUserId,
      approvedAt: data.approvedAt,
      informalReminderAt: data.informalReminderAt,
      informalReminderNotes: data.informalReminderNotes,
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

  async createLoan(loan: Loan): Promise<void> {
    const data = loan.toJSON();
    const assocId = await this.resolveAssociationId(data.associationId) || data.associationId;
    
    await this.prisma.loan.create({
      data: {
        id: data.id,
        associationId: assocId,
        borrowerMemberId: data.borrowerMemberId,
        guarantorMemberId: data.guarantorMemberId,
        caisseId: data.caisseId,
        amount: data.amount,
        interestRate: data.interestRate,
        dailyPenaltyRate: data.dailyPenaltyRate,
        totalToRepay: data.totalToRepay,
        balanceRemaining: data.balanceRemaining,
        status: data.status,
        reason: data.reason,
        startDate: data.startDate,
        dueDate: data.dueDate,
        approvedByUserId: data.approvedByUserId,
        approvedAt: data.approvedAt,
        informalReminderAt: data.informalReminderAt,
        informalReminderNotes: data.informalReminderNotes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async updateLoan(loan: Loan): Promise<void> {
    const data = loan.toJSON();
    await this.prisma.loan.update({
      where: { id: data.id },
      data: {
        balanceRemaining: data.balanceRemaining,
        status: data.status,
        approvedByUserId: data.approvedByUserId,
        approvedAt: data.approvedAt,
        informalReminderAt: data.informalReminderAt,
        informalReminderNotes: data.informalReminderNotes,
        startDate: data.startDate,
        dueDate: data.dueDate,
        updatedAt: data.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<Loan | null> {
    const data = await this.prisma.loan.findUnique({
      where: { id },
    });
    return data ? this.mapToEntity(data) : null;
  }

  async listByAssociation(associationId: string, status?: LoanStatus): Promise<Loan[]> {
    const assocId = await this.resolveAssociationId(associationId) || associationId;
    const where: any = { associationId: assocId };
    if (status) where.status = status;

    const data = await this.prisma.loan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async listByMember(memberId: string): Promise<Loan[]> {
    const data = await this.prisma.loan.findMany({
      where: { borrowerMemberId: memberId },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async listAllByStatus(status: LoanStatus): Promise<Loan[]> {
    const data = await this.prisma.loan.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => this.mapToEntity(d));
  }

  async createRepayment(data: CreateRepaymentData): Promise<any> {
    return this.prisma.loanRepayment.create({
      data: {
        loanId: data.loanId,
        amount: data.amount,
        transactionId: data.transactionId,
        notes: data.notes,
        createdByUserId: data.createdByUserId,
      },
    });
  }

  async listRepayments(loanId: string): Promise<any[]> {
    return this.prisma.loanRepayment.findMany({
      where: { loanId },
      orderBy: { paidAt: 'desc' },
    });
  }

  // ACID transaction for loan approval (checks balance, updates caisse, creates transaction, updates loan atomically)
  async approveLoanAtomic(loanId: string, approvedByUserId: string, associationId: string): Promise<Loan> {
    const assocId = await this.resolveAssociationId(associationId) || associationId;

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Fetch loan inside transaction
      const rawLoan = await tx.loan.findUnique({
        where: { id: loanId },
      });
      if (!rawLoan) {
        throw new Error(`Prêt avec l'ID "${loanId}" introuvable`);
      }
      if (rawLoan.status !== LoanStatus.PENDING) {
        throw new Error(`Seuls les prêts en attente peuvent être approuvés`);
      }

      // 2. Fetch caisse inside transaction and check balance
      const caisse = await tx.caisse.findUnique({
        where: { id: rawLoan.caisseId },
      });
      if (!caisse) {
        throw new Error(`Caisse avec l'ID "${rawLoan.caisseId}" introuvable`);
      }
      if (caisse.balance < rawLoan.amount) {
        throw new Error(
          `Solde insuffisant dans la caisse (${caisse.name}: ${caisse.balance.toLocaleString('fr-FR')} XAF disponibles, prêt demandé: ${rawLoan.amount.toLocaleString('fr-FR')} XAF)`
        );
      }

      // 3. Atomically decrement caisse balance
      await tx.caisse.update({
        where: { id: caisse.id },
        data: {
          balance: { decrement: rawLoan.amount },
          updatedAt: new Date(),
        },
      });

      // 4. Create treasury withdrawal transaction
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const refSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const reference = `LND-${dateStr}-${refSuffix}`;

      await tx.transaction.create({
        data: {
          id: `tx-lnd-${rawLoan.id}`,
          associationId: assocId,
          caisseId: caisse.id,
          type: 'WITHDRAWAL',
          amount: rawLoan.amount,
          reference,
          description: `Décaissement prêt (ID: ${rawLoan.id.slice(0, 8)})`,
          memberId: rawLoan.borrowerMemberId,
          status: 'CONFIRMED',
          createdByUserId: approvedByUserId,
          approvedByUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 5. Update loan status to APPROVED
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.APPROVED,
          approvedByUserId,
          approvedAt: new Date(),
          startDate: new Date(),
          updatedAt: new Date(),
        },
      });

      return this.mapToEntity(updatedLoan);
    });
  }

  // ACID transaction for loan repayment (increments caisse, creates deposit transaction, records repayment, updates loan balance atomically)
  async repayLoanAtomic(
    loanId: string,
    amount: number,
    notes?: string,
    createdByUserId?: string,
    associationId?: string,
  ): Promise<{ loan: Loan; repayment: any }> {
    const assocIdResolved = associationId ? await this.resolveAssociationId(associationId) : null;

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Fetch loan inside transaction
      const rawLoan = await tx.loan.findUnique({
        where: { id: loanId },
      });
      if (!rawLoan) {
        throw new Error(`Prêt avec l'ID "${loanId}" introuvable`);
      }
      if (rawLoan.status !== LoanStatus.APPROVED && rawLoan.status !== LoanStatus.DISBURSED) {
        throw new Error(`Seuls les prêts en cours peuvent faire l'objet d'un remboursement`);
      }
      if (amount > rawLoan.balanceRemaining) {
        throw new Error(
          `Le montant du remboursement (${amount} XAF) dépasse le solde restant dû (${rawLoan.balanceRemaining} XAF)`
        );
      }

      const assocId = assocIdResolved || rawLoan.associationId;

      // 2. Increment caisse balance
      await tx.caisse.update({
        where: { id: rawLoan.caisseId },
        data: {
          balance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      // 3. Create treasury deposit transaction
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const refSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const reference = `LRP-${dateStr}-${refSuffix}`;

      const treasuryTx = await tx.transaction.create({
        data: {
          id: `tx-lrp-${Date.now()}-${refSuffix}`,
          associationId: assocId,
          caisseId: rawLoan.caisseId,
          type: 'DEPOSIT',
          amount,
          reference,
          description: `Remboursement prêt (ID: ${rawLoan.id.slice(0, 8)})`,
          memberId: rawLoan.borrowerMemberId,
          status: 'CONFIRMED',
          createdByUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 4. Create repayment record
      const repayment = await tx.loanRepayment.create({
        data: {
          loanId: rawLoan.id,
          amount,
          transactionId: treasuryTx.id,
          notes,
          createdByUserId,
          paidAt: new Date(),
        },
      });

      // 5. Update loan balance & status
      const newBalance = Math.max(0, rawLoan.balanceRemaining - amount);
      const newStatus = newBalance === 0 ? LoanStatus.COMPLETED : rawLoan.status;

      const updatedLoan = await tx.loan.update({
        where: { id: rawLoan.id },
        data: {
          balanceRemaining: newBalance,
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      return {
        loan: this.mapToEntity(updatedLoan),
        repayment,
      };
    });
  }
}

