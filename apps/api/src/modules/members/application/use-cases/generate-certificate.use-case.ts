import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
  CertificateData,
} from '../../domain/repositories/member.repository.interface';
import { MemberStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface GenerateCertificateCommand {
  associationId: string;
  memberId: string;
  associationSlug: string;
  associationName?: string;
}

@Injectable()
export class GenerateCertificateUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: GenerateCertificateCommand) {
    const assocId =
      (await this.memberRepository.resolveAssociationId(command.associationId)) ||
      command.associationId;

    const member = await this.memberRepository.findById(command.memberId);
    if (!member || member.associationId !== assocId) {
      throw new NotFoundException('Member not found');
    }

    if (member.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active members in good standing can generate a certificate',
      );
    }

    const token = crypto.randomBytes(16).toString('hex');
    const cert = await this.memberRepository.createCertificate(
      command.associationId,
      command.memberId,
      token,
    );

    const verificationUrl = `http://${command.associationSlug}.lvh.me:3000/verify/certificate/${cert.token}`;

    return {
      certificateId: cert.id,
      token: cert.token,
      associationName: cert.associationName,
      verificationUrl,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      member: member.toResponseObject(),
    };
  }

  async verify(token: string) {
    const cert = await this.memberRepository.findCertificateByToken(token);
    if (!cert) {
      throw new NotFoundException('Invalid or expired certificate token');
    }

    const now = new Date();
    const isExpired = cert.expiresAt ? cert.expiresAt < now : false;
    const isRevoked = !!cert.revokedAt;

    return {
      isValid: cert.member.status === MemberStatus.ACTIVE && !isExpired && !isRevoked,
      isExpired,
      isRevoked,
      revokedAt: cert.revokedAt,
      revokedReason: cert.revokedReason,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      associationName: cert.associationName,
      associationLogoUrl: cert.associationLogoUrl,
      member: cert.member.toResponseObject(),
    };
  }

  async listByMember(memberId: string, associationId: string): Promise<CertificateData[]> {
    return this.memberRepository.listCertificatesByMember(memberId, associationId);
  }
}
