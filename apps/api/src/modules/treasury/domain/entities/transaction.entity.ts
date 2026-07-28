import { TransactionType, TransactionStatus } from '@prisma/client';

export interface TransactionProps {
  id: string;
  associationId: string;
  caisseId: string;
  destinationCaisseId?: string | null;
  type: TransactionType;
  amount: number;
  reference: string;
  description?: string | null;
  memberId?: string | null;
  status: TransactionStatus;
  receiptUrl?: string | null;
  createdByUserId?: string | null;
  approvedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  public static create(props: TransactionProps): Transaction {
    // Basic validation
    if (props.amount <= 0) {
      throw new Error("Transaction amount must be strictly positive");
    }
    if (props.type === TransactionType.TRANSFER && !props.destinationCaisseId) {
      throw new Error("A transfer must have a destination caisse");
    }
    if (props.type === TransactionType.TRANSFER && props.caisseId === props.destinationCaisseId) {
      throw new Error("Cannot transfer to the same caisse");
    }

    return new Transaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get associationId(): string {
    return this.props.associationId;
  }

  get caisseId(): string {
    return this.props.caisseId;
  }

  get destinationCaisseId(): string | null | undefined {
    return this.props.destinationCaisseId;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get amount(): number {
    return this.props.amount;
  }

  get reference(): string {
    return this.props.reference;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get memberId(): string | null | undefined {
    return this.props.memberId;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get receiptUrl(): string | null | undefined {
    return this.props.receiptUrl;
  }

  public complete(): void {
    if (this.props.status !== TransactionStatus.PENDING) {
      throw new Error("Only pending transactions can be completed");
    }
    this.props.status = TransactionStatus.CONFIRMED;
    this.props.updatedAt = new Date();
  }

  public fail(): void {
    if (this.props.status !== TransactionStatus.PENDING) {
      throw new Error("Only pending transactions can be marked as failed");
    }
    this.props.status = TransactionStatus.FAILED;
    this.props.updatedAt = new Date();
  }

  public setReceiptUrl(url: string): void {
    this.props.receiptUrl = url;
    this.props.updatedAt = new Date();
  }

  public toJSON(): TransactionProps {
    return { ...this.props };
  }
}
