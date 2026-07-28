import { SanctionStatus, SanctionSeverity } from '@prisma/client';

export interface SanctionProps {
  id: string;
  associationId: string;
  memberId: string;
  caisseId?: string | null;
  title: string;
  reason?: string | null;
  fineAmount: number;
  status: SanctionStatus;
  severity: SanctionSeverity;
  issuedByUserId?: string | null;
  paidAt?: Date | null;
  transactionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Sanction {
  private constructor(private readonly props: SanctionProps) {}

  public static create(props: SanctionProps): Sanction {
    if (props.fineAmount < 0) {
      throw new Error("Fine amount cannot be negative");
    }
    if (!props.title || props.title.trim() === '') {
      throw new Error("Sanction title is required");
    }
    return new Sanction(props);
  }

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get memberId(): string { return this.props.memberId; }
  get caisseId(): string | null | undefined { return this.props.caisseId; }
  get title(): string { return this.props.title; }
  get reason(): string | null | undefined { return this.props.reason; }
  get fineAmount(): number { return this.props.fineAmount; }
  get status(): SanctionStatus { return this.props.status; }
  get severity(): SanctionSeverity { return this.props.severity; }
  get issuedByUserId(): string | null | undefined { return this.props.issuedByUserId; }
  get paidAt(): Date | null | undefined { return this.props.paidAt; }
  get transactionId(): string | null | undefined { return this.props.transactionId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public markAsPaid(transactionId?: string, caisseId?: string): void {
    if (this.props.status !== SanctionStatus.PENDING) {
      throw new Error("Only pending sanctions can be marked as paid");
    }
    this.props.status = SanctionStatus.PAID;
    this.props.paidAt = new Date();
    if (transactionId) this.props.transactionId = transactionId;
    if (caisseId) this.props.caisseId = caisseId;
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.props.status !== SanctionStatus.PENDING) {
      throw new Error("Only pending sanctions can be cancelled");
    }
    this.props.status = SanctionStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  public excuse(): void {
    if (this.props.status !== SanctionStatus.PENDING) {
      throw new Error("Only pending sanctions can be excused");
    }
    this.props.status = SanctionStatus.EXCUSED;
    this.props.updatedAt = new Date();
  }

  public toJSON(): SanctionProps {
    return { ...this.props };
  }
}
