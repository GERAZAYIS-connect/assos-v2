import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { MemberEntity } from '../../domain/entities/member.entity';
import {
  IMemberRepository,
  CreateInvitationData,
  InvitationData,
  CertificateData,
  CertificateWithMember,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole, MemberStatus } from '@prisma/client';
import { MemberNumber } from '../../domain/value-objects/member-number.vo';

@Injectable()
export class PrismaMemberRepository implements IMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(raw: any): MemberEntity {
    return new MemberEntity({
      id: raw.id,
      associationId: raw.associationId,
      userId: raw.userId,
      role: raw.role,
      status: raw.status,
      memberNumber: raw.memberNumber ?? undefined,
      joinedAt: raw.joinedAt,
      suspendedAt: raw.suspendedAt ?? undefined,
      expelledAt: raw.expelledAt ?? undefined,
      proxyUserId: raw.proxyUserId ?? undefined,
      userEmail: raw.user?.email ?? undefined,
      userPhone: raw.user?.phone ?? undefined,
      profile: raw.profile
        ? {
            firstName: raw.profile.firstName ?? undefined,
            lastName: raw.profile.lastName ?? undefined,
            photoUrl: raw.profile.photoUrl ?? undefined,
            idCardType: raw.profile.idCardType ?? undefined,
            idCardNumber: raw.profile.idCardNumber ?? undefined,
            idCardUrl: raw.profile.idCardUrl ?? undefined,
            address: raw.profile.address ?? undefined,
            profession: raw.profile.profession ?? undefined,
            emergencyContactName: raw.profile.emergencyContactName ?? undefined,
            emergencyContactPhone: raw.profile.emergencyContactPhone ?? undefined,
            proxyName: raw.profile.proxyName ?? undefined,
            proxyPhone: raw.profile.proxyPhone ?? undefined,
            proxyNotes: raw.profile.proxyNotes ?? undefined,
            proxyIsActive: raw.profile.proxyIsActive ?? false,
            proxyExpiresAt: raw.profile.proxyExpiresAt ?? undefined,
          }
        : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    return assoc ? assoc.id : null;
  }

  async findById(id: string): Promise<MemberEntity | null> {
    const raw = await this.prisma.associationMember.findUnique({
      where: { id },
      include: { user: true, profile: true },
    });
    return raw ? this.mapToEntity(raw) : null;
  }

  async findByAssociationAndUser(
    associationIdOrSlug: string,
    userId: string,
  ): Promise<MemberEntity | null> {
    const assocId = await this.resolveAssociationId(associationIdOrSlug);
    if (!assocId) return null;

    const raw = await this.prisma.associationMember.findUnique({
      where: { associationId_userId: { associationId: assocId, userId } },
      include: { user: true, profile: true },
    });
    return raw ? this.mapToEntity(raw) : null;
  }

  async listByAssociation(
    associationIdOrSlug: string,
    options?: { status?: MemberStatus; role?: AssociationRole; search?: string },
  ): Promise<MemberEntity[]> {
    const assocId = await this.resolveAssociationId(associationIdOrSlug);
    if (!assocId) return [];

    const where: any = { associationId: assocId };
    if (options?.status) where.status = options.status;
    if (options?.role) where.role = options.role;

    if (options?.search) {
      where.OR = [
        { memberNumber: { contains: options.search } },
        { user: { email: { contains: options.search } } },
        { user: { phone: { contains: options.search } } },
        { profile: { firstName: { contains: options.search } } },
        { profile: { lastName: { contains: options.search } } },
      ];
    }

    const rawList = await this.prisma.associationMember.findMany({
      where,
      include: { user: true, profile: true },
      orderBy: { createdAt: 'desc' },
    });

    return rawList.map((raw) => this.mapToEntity(raw));
  }

  async save(member: MemberEntity): Promise<MemberEntity> {
    const data = {
      role: member.role,
      status: member.status,
      suspendedAt: member.suspendedAt ?? null,
      expelledAt: member.expelledAt ?? null,
      proxyUserId: member.proxyUserId ?? null,
    };

    await this.prisma.associationMember.update({
      where: { id: member.id },
      data,
    });

    if (member.profile) {
      await this.prisma.memberProfile.upsert({
        where: { memberId: member.id },
        create: {
          memberId: member.id,
          firstName: member.profile.firstName,
          lastName: member.profile.lastName,
          photoUrl: member.profile.photoUrl,
          idCardType: member.profile.idCardType,
          idCardNumber: member.profile.idCardNumber,
          idCardUrl: member.profile.idCardUrl,
          address: member.profile.address,
          profession: member.profile.profession,
          emergencyContactName: member.profile.emergencyContactName,
          emergencyContactPhone: member.profile.emergencyContactPhone,
          proxyName: member.profile.proxyName ?? null,
          proxyPhone: member.profile.proxyPhone ?? null,
          proxyNotes: member.profile.proxyNotes ?? null,
          proxyIsActive: member.profile.proxyIsActive ?? false,
          proxyExpiresAt: member.profile.proxyExpiresAt ?? null,
        },
        update: {
          firstName: member.profile.firstName,
          lastName: member.profile.lastName,
          photoUrl: member.profile.photoUrl,
          idCardType: member.profile.idCardType,
          idCardNumber: member.profile.idCardNumber,
          idCardUrl: member.profile.idCardUrl,
          address: member.profile.address,
          profession: member.profile.profession,
          emergencyContactName: member.profile.emergencyContactName,
          emergencyContactPhone: member.profile.emergencyContactPhone,
          proxyName: member.profile.proxyName ?? null,
          proxyPhone: member.profile.proxyPhone ?? null,
          proxyNotes: member.profile.proxyNotes ?? null,
          proxyIsActive: member.profile.proxyIsActive ?? false,
          proxyExpiresAt: member.profile.proxyExpiresAt ?? null,
        },
      });
    }

    const reloaded = await this.findById(member.id);
    return reloaded!;
  }

  async createMember(
    associationId: string,
    userId: string,
    role: AssociationRole,
  ): Promise<MemberEntity> {
    const assoc = await this.prisma.association.findUnique({ where: { id: associationId } });
    const now = new Date();
    const memberNumber = MemberNumber.generate(assoc?.name || assoc?.slug || 'ASS', now);

    const raw = await this.prisma.associationMember.create({
      data: {
        associationId,
        userId,
        role,
        memberNumber,
        status: MemberStatus.ACTIVE,
      },
      include: { user: true, profile: true },
    });

    return this.mapToEntity(raw);
  }

  async createInvitation(data: CreateInvitationData): Promise<InvitationData> {
    const assocId = (await this.resolveAssociationId(data.associationId)) || data.associationId;

    const raw = await this.prisma.invitation.create({
      data: {
        associationId: assocId,
        invitedByMemberId: data.invitedByMemberId,
        email: data.email ?? null,
        phone: data.phone ?? null,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });

    return {
      id: raw.id,
      associationId: raw.associationId,
      invitedByMemberId: raw.invitedByMemberId,
      email: raw.email ?? undefined,
      phone: raw.phone ?? undefined,
      role: raw.role,
      token: raw.token,
      expiresAt: raw.expiresAt,
      usedAt: raw.usedAt ?? undefined,
      createdAt: raw.createdAt,
    };
  }

  async findInvitationByToken(token: string): Promise<InvitationData | null> {
    const raw = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        association: true,
        invitedBy: {
          include: { user: true, profile: true },
        },
      },
    });

    if (!raw) return null;

    const inviterName = raw.invitedBy?.profile?.firstName
      ? `${raw.invitedBy.profile.firstName} ${raw.invitedBy.profile.lastName || ''}`.trim()
      : raw.invitedBy?.user?.email || 'Un membre du bureau';

    return {
      id: raw.id,
      associationId: raw.associationId,
      invitedByMemberId: raw.invitedByMemberId,
      email: raw.email ?? undefined,
      phone: raw.phone ?? undefined,
      role: raw.role,
      token: raw.token,
      expiresAt: raw.expiresAt,
      usedAt: raw.usedAt ?? undefined,
      createdAt: raw.createdAt,
      associationName: raw.association?.name,
      associationSlug: raw.association?.slug,
      inviterName,
    };
  }

  async markInvitationUsed(id: string): Promise<void> {
    await this.prisma.invitation.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createCertificate(
    associationIdOrSlug: string,
    memberId: string,
    token: string,
  ): Promise<CertificateData> {
    const assocId = (await this.resolveAssociationId(associationIdOrSlug)) || associationIdOrSlug;
    const assoc = await this.prisma.association.findUnique({ where: { id: assocId } });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const raw = await this.prisma.memberCertificate.create({
      data: {
        associationId: assocId,
        associationName: assoc?.name ?? null,
        memberId,
        token,
        expiresAt,
      },
    });

    return {
      id: raw.id,
      token: raw.token,
      associationId: raw.associationId,
      associationName: raw.associationName ?? undefined,
      associationLogoUrl: assoc?.logoUrl ?? undefined,
      memberId: raw.memberId,
      issuedAt: raw.issuedAt,
      expiresAt: raw.expiresAt ?? undefined,
      revokedAt: raw.revokedAt ?? undefined,
      revokedReason: raw.revokedReason ?? undefined,
    };
  }

  async findCertificateByToken(token: string): Promise<CertificateWithMember | null> {
    const raw = await this.prisma.memberCertificate.findUnique({
      where: { token },
      include: {
        association: true,
        member: {
          include: { user: true, profile: true },
        },
      },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      token: raw.token,
      associationId: raw.associationId,
      associationName: raw.associationName ?? undefined,
      associationLogoUrl: raw.association?.logoUrl ?? undefined,
      memberId: raw.memberId,
      issuedAt: raw.issuedAt,
      expiresAt: raw.expiresAt ?? undefined,
      revokedAt: raw.revokedAt ?? undefined,
      revokedReason: raw.revokedReason ?? undefined,
      member: this.mapToEntity(raw.member),
    };
  }

  async listCertificatesByMember(
    memberId: string,
    associationId: string,
  ): Promise<CertificateData[]> {
    const assocId = (await this.resolveAssociationId(associationId)) || associationId;

    const rows = await this.prisma.memberCertificate.findMany({
      where: { memberId, associationId: assocId },
      orderBy: { issuedAt: 'desc' },
    });

    return rows.map((raw) => ({
      id: raw.id,
      token: raw.token,
      associationId: raw.associationId,
      associationName: raw.associationName ?? undefined,
      memberId: raw.memberId,
      issuedAt: raw.issuedAt,
      expiresAt: raw.expiresAt ?? undefined,
      revokedAt: raw.revokedAt ?? undefined,
      revokedReason: raw.revokedReason ?? undefined,
    }));
  }

  async revokeCertificate(certificateId: string, reason?: string): Promise<void> {
    await this.prisma.memberCertificate.update({
      where: { id: certificateId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason ?? null,
      },
    });
  }
}
