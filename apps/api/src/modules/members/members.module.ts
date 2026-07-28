import { Module } from '@nestjs/common';
import { MEMBER_REPOSITORY } from './domain/repositories/member.repository.interface';
import { PrismaMemberRepository } from './infrastructure/repositories/prisma-member.repository';
import { ListMembersUseCase } from './application/use-cases/list-members.use-case';
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { UpdateMemberStatusUseCase } from './application/use-cases/update-member-status.use-case';
import { AssignProxyUseCase } from './application/use-cases/assign-proxy.use-case';
import { RevokeProxyUseCase } from './application/use-cases/revoke-proxy.use-case';
import { GenerateCertificateUseCase } from './application/use-cases/generate-certificate.use-case';
import { RevokeCertificateUseCase } from './application/use-cases/revoke-certificate.use-case';
import { GetMemberDetailsUseCase } from './application/use-cases/get-member-details.use-case';
import { UpdateMemberProfileUseCase } from './application/use-cases/update-member-profile.use-case';
import { ValidateJoiningFeeUseCase } from './application/use-cases/validate-joining-fee.use-case';
import { AddMemberManuallyUseCase } from './application/use-cases/add-member-manually.use-case';
import { MembersController } from './interfaces/http/members.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MembersController],
  providers: [
    ListMembersUseCase,
    InviteMemberUseCase,
    AcceptInvitationUseCase,
    UpdateMemberStatusUseCase,
    AssignProxyUseCase,
    RevokeProxyUseCase,
    GenerateCertificateUseCase,
    RevokeCertificateUseCase,
    GetMemberDetailsUseCase,
    UpdateMemberProfileUseCase,
    ValidateJoiningFeeUseCase,
    AddMemberManuallyUseCase,
    { provide: MEMBER_REPOSITORY, useClass: PrismaMemberRepository },
  ],
  exports: [
    MEMBER_REPOSITORY,
    ListMembersUseCase,
    InviteMemberUseCase,
    AcceptInvitationUseCase,
    UpdateMemberStatusUseCase,
    AssignProxyUseCase,
    RevokeProxyUseCase,
    GenerateCertificateUseCase,
    RevokeCertificateUseCase,
    GetMemberDetailsUseCase,
    UpdateMemberProfileUseCase,
    ValidateJoiningFeeUseCase,
    AddMemberManuallyUseCase,
  ],
})
export class MembersModule {}
