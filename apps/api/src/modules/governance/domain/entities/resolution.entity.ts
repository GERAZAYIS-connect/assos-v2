import { ResolutionCategory, ResolutionStatus, VoteType, AssociationRole } from '@prisma/client';

export interface ResolutionProps {
  id: string;
  associationId: string;
  meetingId?: string | null;
  title: string;
  description?: string | null;
  category: ResolutionCategory;
  status: ResolutionStatus;
  voteType: VoteType;
  quorumThreshold: number;
  majorityThreshold: number;
  targetRole?: AssociationRole | null;
  candidateMemberId?: string | null;
  electedMemberId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  votes?: any[];
  electedMember?: any;
}

export class Resolution {
  private props: ResolutionProps;

  constructor(props: ResolutionProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get meetingId(): string | null | undefined { return this.props.meetingId; }
  get title(): string { return this.props.title; }
  get description(): string | null | undefined { return this.props.description; }
  get category(): ResolutionCategory { return this.props.category; }
  get status(): ResolutionStatus { return this.props.status; }
  get voteType(): VoteType { return this.props.voteType; }
  get quorumThreshold(): number { return this.props.quorumThreshold; }
  get majorityThreshold(): number { return this.props.majorityThreshold; }
  get targetRole(): AssociationRole | null | undefined { return this.props.targetRole; }
  get candidateMemberId(): string | null | undefined { return this.props.candidateMemberId; }
  get electedMemberId(): string | null | undefined { return this.props.electedMemberId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get votes(): any[] | undefined { return this.props.votes; }
  get electedMember(): any { return this.props.electedMember; }

  toJSON() {
    return {
      ...this.props,
    };
  }
}
