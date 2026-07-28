import { TontineType, TontineStatus, TontineFrequency } from '@prisma/client';

export interface TontineProps {
  id: string;
  associationId: string;
  caisseId?: string | null;
  name: string;
  description?: string | null;
  type: TontineType;
  amountPerRound: number;
  frequency: TontineFrequency;
  status: TontineStatus;
  startDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Tontine {
  constructor(private readonly props: TontineProps) {}

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get caisseId(): string | null | undefined { return this.props.caisseId; }
  get name(): string { return this.props.name; }
  get description(): string | null | undefined { return this.props.description; }
  get type(): TontineType { return this.props.type; }
  get amountPerRound(): number { return this.props.amountPerRound; }
  get frequency(): TontineFrequency { return this.props.frequency; }
  get status(): TontineStatus { return this.props.status; }
  get startDate(): Date | null | undefined { return this.props.startDate; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  activate() {
    this.props.status = TontineStatus.ACTIVE;
    this.props.startDate = new Date();
  }

  complete() {
    this.props.status = TontineStatus.COMPLETED;
  }

  cancel() {
    this.props.status = TontineStatus.CANCELLED;
  }

  toJSON() {
    return { ...this.props };
  }
}
