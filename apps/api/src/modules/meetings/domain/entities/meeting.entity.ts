import { MeetingType, MeetingStatus, AttendanceStatus } from '@prisma/client';

export interface MeetingProps {
  id: string;
  associationId: string;
  title: string;
  description?: string | null;
  type: MeetingType;
  status: MeetingStatus;
  location?: string | null;
  scheduledAt: Date;
  startedAt?: Date | null;
  endedAt?: Date | null;
  agenda?: string | null;
  minutes?: string | null;
  autoSanctionAbsence: boolean;
  absenceFineAmount: number;
  createdAt: Date;
  updatedAt: Date;
  attendances?: any[];
}

export class Meeting {
  private props: MeetingProps;

  constructor(props: MeetingProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get title(): string { return this.props.title; }
  get description(): string | null | undefined { return this.props.description; }
  get type(): MeetingType { return this.props.type; }
  get status(): MeetingStatus { return this.props.status; }
  get location(): string | null | undefined { return this.props.location; }
  get scheduledAt(): Date { return this.props.scheduledAt; }
  get startedAt(): Date | null | undefined { return this.props.startedAt; }
  get endedAt(): Date | null | undefined { return this.props.endedAt; }
  get agenda(): string | null | undefined { return this.props.agenda; }
  get minutes(): string | null | undefined { return this.props.minutes; }
  get autoSanctionAbsence(): boolean { return this.props.autoSanctionAbsence; }
  get absenceFineAmount(): number { return this.props.absenceFineAmount; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get attendances(): any[] | undefined { return this.props.attendances; }

  toJSON() {
    return {
      ...this.props,
    };
  }
}
