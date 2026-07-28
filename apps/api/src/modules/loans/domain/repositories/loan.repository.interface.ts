import { Loan } from '../entities/loan.entity';
import { LoanStatus } from '@prisma/client';

export interface CreateRepaymentData {
  loanId: string;
  amount: number;
  transactionId?: string;
  notes?: string;
  createdByUserId?: string;
}

export interface ILoanRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  createLoan(loan: Loan): Promise<void>;
  updateLoan(loan: Loan): Promise<void>;
  findById(id: string): Promise<Loan | null>;
  listByAssociation(associationId: string, status?: LoanStatus): Promise<Loan[]>;
  listByMember(memberId: string): Promise<Loan[]>;
  createRepayment(data: CreateRepaymentData): Promise<any>;
  listRepayments(loanId: string): Promise<any[]>;
  approveLoanAtomic(loanId: string, approvedByUserId: string, associationId: string): Promise<Loan>;
  repayLoanAtomic(loanId: string, amount: number, notes?: string, createdByUserId?: string, associationId?: string): Promise<{ loan: Loan; repayment: any }>;
  listAllByStatus(status: LoanStatus): Promise<Loan[]>;
}
