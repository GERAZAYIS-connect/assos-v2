import { AssociationRole, MemberStatus } from '@prisma/client';

export interface MemberProfileProps {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  idCardType?: string;
  idCardNumber?: string;
  idCardUrl?: string;
  address?: string;
  profession?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  proxyName?: string;
  proxyPhone?: string;
  proxyNotes?: string;
  proxyIsActive?: boolean;
  proxyExpiresAt?: Date;
}

export interface MemberProps {
  id: string;
  associationId: string;
  userId: string;
  role: AssociationRole;
  status: MemberStatus;
  memberNumber?: string;
  joinedAt: Date;
  suspendedAt?: Date;
  expelledAt?: Date;
  proxyUserId?: string;
  profile?: MemberProfileProps;
  userEmail?: string;
  userPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MemberEntity {
  constructor(private readonly props: MemberProps) {}

  get id(): string { return this.props.id; }
  get associationId(): string { return this.props.associationId; }
  get userId(): string { return this.props.userId; }
  get role(): AssociationRole { return this.props.role; }
  get status(): MemberStatus { return this.props.status; }
  get memberNumber(): string | undefined { return this.props.memberNumber; }
  get joinedAt(): Date { return this.props.joinedAt; }
  get suspendedAt(): Date | undefined { return this.props.suspendedAt; }
  get expelledAt(): Date | undefined { return this.props.expelledAt; }
  get proxyUserId(): string | undefined { return this.props.proxyUserId; }
  get profile(): MemberProfileProps | undefined { return this.props.profile; }
  get userEmail(): string | undefined { return this.props.userEmail; }
  get userPhone(): string | undefined { return this.props.userPhone; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updateRole(newRole: AssociationRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  updateProfile(profileData: Partial<MemberProfileProps>): void {
    this.props.profile = {
      ...this.props.profile,
      ...profileData,
    };
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    if (this.props.status === MemberStatus.EXPELLED) {
      throw new Error('Cannot suspend an expelled member');
    }
    this.props.status = MemberStatus.SUSPENDED;
    this.props.suspendedAt = new Date();
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === MemberStatus.EXPELLED) {
      throw new Error('Cannot reactivate an expelled member directly');
    }
    this.props.status = MemberStatus.ACTIVE;
    this.props.suspendedAt = undefined;
    this.props.updatedAt = new Date();
  }

  expel(): void {
    this.props.status = MemberStatus.EXPELLED;
    this.props.expelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateProxy(
    proxyName?: string,
    proxyPhone?: string,
    proxyNotes?: string,
    expiresAt?: Date,
  ): void {
    if (!this.props.profile) {
      this.props.profile = {};
    }
    this.props.profile.proxyName = proxyName;
    this.props.profile.proxyPhone = proxyPhone;
    this.props.profile.proxyNotes = proxyNotes;
    this.props.profile.proxyIsActive = !!(proxyName || proxyPhone);
    this.props.profile.proxyExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  revokeProxy(): void {
    if (!this.props.profile) {
      this.props.profile = {};
    }
    this.props.profile.proxyIsActive = false;
    this.props.profile.proxyName = undefined;
    this.props.profile.proxyPhone = undefined;
    this.props.profile.proxyNotes = undefined;
    this.props.profile.proxyExpiresAt = undefined;
    this.props.updatedAt = new Date();
  }

  toResponseObject() {
    return {
      id: this.id,
      associationId: this.associationId,
      userId: this.userId,
      role: this.role,
      status: this.status,
      memberNumber: this.memberNumber,
      joinedAt: this.joinedAt,
      suspendedAt: this.suspendedAt,
      expelledAt: this.expelledAt,
      proxyUserId: this.proxyUserId,
      userEmail: this.userEmail,
      userPhone: this.userPhone,
      profile: this.profile,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
