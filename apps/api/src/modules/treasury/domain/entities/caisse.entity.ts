import { CaisseType } from '@prisma/client';

export interface CaisseProps {
  id: string;
  associationId: string;
  type: CaisseType;
  name: string;
  balance: number;
  isLoanable: boolean;
  isBankAccount: boolean;
  accountDetails?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Caisse {
  private constructor(private readonly props: CaisseProps) {}

  public static create(props: CaisseProps): Caisse {
    return new Caisse(props);
  }

  get id(): string {
    return this.props.id;
  }

  get associationId(): string {
    return this.props.associationId;
  }

  get type(): CaisseType {
    return this.props.type;
  }

  get name(): string {
    return this.props.name;
  }

  get balance(): number {
    return this.props.balance;
  }

  get isLoanable(): boolean {
    return this.props.isLoanable;
  }

  get isBankAccount(): boolean {
    return this.props.isBankAccount;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  public credit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Credit amount must be positive");
    }
    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  public debit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Debit amount must be positive");
    }
    if (this.props.balance < amount) {
      throw new Error(`Insufficient funds in Caisse ${this.name}`);
    }
    this.props.balance -= amount;
    this.props.updatedAt = new Date();
  }

  public updateDetails(name: string, isLoanable: boolean, isActive: boolean): void {
    this.props.name = name;
    this.props.isLoanable = isLoanable;
    this.props.isActive = isActive;
    this.props.updatedAt = new Date();
  }

  public toJSON(): CaisseProps {
    return { ...this.props };
  }
}
