import { MemberEntity } from '../entities/member.entity';
import { AssociationRole, MemberStatus } from '@prisma/client';

export const MEMBER_REPOSITORY = 'MEMBER_REPOSITORY';

export interface CreateInvitationData {
  associationId: string;
  invitedByMemberId: string;
  email?: string;
  phone?: string;
  role: AssociationRole;
  token: string;
  expiresAt: Date;
}

export interface InvitationData {
  id: string;
  associationId: string;
  invitedByMemberId: string;
  email?: string;
  phone?: string;
  role: AssociationRole;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  associationName?: string;
  associationSlug?: string;
  inviterName?: string;
}

export interface CertificateData {
  id: string;
  token: string;
  associationId: string;
  associationName?: string;
  associationLogoUrl?: string;
  memberId: string;
  issuedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

export interface CertificateWithMember extends CertificateData {
  member: MemberEntity;
}

export interface IMemberRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  findById(id: string): Promise<MemberEntity | null>;
  findByAssociationAndUser(associationId: string, userId: string): Promise<MemberEntity | null>;
  listByAssociation(
    associationId: string,
    options?: { status?: MemberStatus; role?: AssociationRole; search?: string }
  ): Promise<MemberEntity[]>;
  save(member: MemberEntity): Promise<MemberEntity>;
  createMember(associationId: string, userId: string, role: AssociationRole): Promise<MemberEntity>;
  createInvitation(data: CreateInvitationData): Promise<InvitationData>;
  findInvitationByToken(token: string): Promise<InvitationData | null>;
  markInvitationUsed(id: string): Promise<void>;
  createCertificate(
    associationId: string,
    memberId: string,
    token: string,
  ): Promise<CertificateData>;
  findCertificateByToken(token: string): Promise<CertificateWithMember | null>;
  listCertificatesByMember(memberId: string, associationId: string): Promise<CertificateData[]>;
  revokeCertificate(certificateId: string, reason?: string): Promise<void>;
}
