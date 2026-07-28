import { LoanStatus } from '@prisma/client';

export interface LoanProps {
  id: string;
  associationId: string;
  borrowerMemberId: string;
  guarantorMemberId?: string | null;
  caisseId: string;
  amount: number;
  interestRate: number;
  dailyPenaltyRate?: number;
  totalToRepay: number;
  balanceRemaining: number;
  status: LoanStatus;
  reason?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  approvedByUserId?: string | null;
  approvedAt?: Date | null;
  informalReminderAt?: Date | null;
  informalReminderNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Loan {
  private constructor(private readonly props: LoanProps) {}

  public static create(props: LoanProps): Loan {
    if (props.amount <= 0) {
      throw new Error("Loan amount must be strictly positive");
    }
    if (props.interestRate < 0) {
      throw new Error("Interest rate cannot be negative");
    }
    return new Loan(props);
  }

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get borrowerMemberId(): string { return this.props.borrowerMemberId; }
  get guarantorMemberId(): string | null | undefined { return this.props.guarantorMemberId; }
  get caisseId(): string { return this.props.caisseId; }
  get amount(): number { return this.props.amount; }
  get interestRate(): number { return this.props.interestRate; }
  get dailyPenaltyRate(): number { return this.props.dailyPenaltyRate ?? 0.001; }
  get totalToRepay(): number { return this.props.totalToRepay; }
  get balanceRemaining(): number { return this.props.balanceRemaining; }
  get status(): LoanStatus { return this.props.status; }
  get reason(): string | null | undefined { return this.props.reason; }
  get startDate(): Date | null | undefined { return this.props.startDate; }
  get dueDate(): Date | null | undefined { return this.props.dueDate; }
  get approvedByUserId(): string | null | undefined { return this.props.approvedByUserId; }
  get approvedAt(): Date | null | undefined { return this.props.approvedAt; }
  get informalReminderAt(): Date | null | undefined { return this.props.informalReminderAt; }
  get informalReminderNotes(): string | null | undefined { return this.props.informalReminderNotes; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public approve(approvedByUserId: string): void {
    if (this.props.status !== LoanStatus.PENDING && this.props.status !== LoanStatus.AWAITING_URGENT_DECISION) {
      throw new Error("Only pending or urgent loans can be approved");
    }
    this.props.status = LoanStatus.APPROVED;
    this.props.approvedByUserId = approvedByUserId;
    this.props.approvedAt = new Date();
    this.props.startDate = new Date();
    this.props.updatedAt = new Date();
  }

  public reject(): void {
    if (this.props.status !== LoanStatus.PENDING && this.props.status !== LoanStatus.AWAITING_URGENT_DECISION) {
      throw new Error("Only pending or urgent loans can be rejected");
    }
    this.props.status = LoanStatus.REJECTED;
    this.props.updatedAt = new Date();
  }

  public markUrgent(): void {
    if (this.props.status === LoanStatus.PENDING) {
      this.props.status = LoanStatus.AWAITING_URGENT_DECISION;
      this.props.updatedAt = new Date();
    }
  }

  public recordInformalReminder(notes?: string): void {
    this.props.informalReminderAt = new Date();
    this.props.informalReminderNotes = notes;
    this.props.updatedAt = new Date();
  }

  public applyRepayment(amount: number): number {
    if (this.props.status !== LoanStatus.APPROVED && this.props.status !== LoanStatus.DISBURSED) {
      throw new Error("Can only repay approved or disbursed loans");
    }
    if (amount <= 0) {
      throw new Error("Repayment amount must be positive");
    }

    this.props.balanceRemaining = Math.max(0, this.props.balanceRemaining - amount);
    if (this.props.balanceRemaining === 0) {
      this.props.status = LoanStatus.COMPLETED;
    }
    this.props.updatedAt = new Date();
    return this.props.balanceRemaining;
  }

  public toJSON(): LoanProps {
    return { ...this.props };
  }
}
