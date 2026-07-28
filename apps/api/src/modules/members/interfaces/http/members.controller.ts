import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ListMembersUseCase } from '../../application/use-cases/list-members.use-case';
import { InviteMemberUseCase } from '../../application/use-cases/invite-member.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/accept-invitation.use-case';
import { UpdateMemberStatusUseCase } from '../../application/use-cases/update-member-status.use-case';
import { AssignProxyUseCase } from '../../application/use-cases/assign-proxy.use-case';
import { RevokeProxyUseCase } from '../../application/use-cases/revoke-proxy.use-case';
import { GenerateCertificateUseCase } from '../../application/use-cases/generate-certificate.use-case';
import { RevokeCertificateUseCase } from '../../application/use-cases/revoke-certificate.use-case';
import { GetMemberDetailsUseCase } from '../../application/use-cases/get-member-details.use-case';
import { UpdateMemberProfileUseCase } from '../../application/use-cases/update-member-profile.use-case';
import { ValidateJoiningFeeUseCase } from '../../application/use-cases/validate-joining-fee.use-case';
import { AddMemberManuallyUseCase } from '../../application/use-cases/add-member-manually.use-case';
import { AssociationRole, MemberStatus } from '@prisma/client';

@ApiTags('Members')
@Controller({ version: '1' })
export class MembersController {
  constructor(
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
    private readonly updateMemberStatusUseCase: UpdateMemberStatusUseCase,
    private readonly assignProxyUseCase: AssignProxyUseCase,
    private readonly revokeProxyUseCase: RevokeProxyUseCase,
    private readonly generateCertificateUseCase: GenerateCertificateUseCase,
    private readonly revokeCertificateUseCase: RevokeCertificateUseCase,
    private readonly getMemberDetailsUseCase: GetMemberDetailsUseCase,
    private readonly updateMemberProfileUseCase: UpdateMemberProfileUseCase,
    private readonly validateJoiningFeeUseCase: ValidateJoiningFeeUseCase,
    private readonly addMemberManuallyUseCase: AddMemberManuallyUseCase,
  ) {}

  // ─── Members ───────────────────────────────────────────────────────────────

  @Get('associations/:associationId/members')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all members of an association' })
  async listMembers(
    @Param('associationId') associationId: string,
    @Query('status') status?: MemberStatus,
    @Query('role') role?: AssociationRole,
    @Query('search') search?: string,
  ) {
    return this.listMembersUseCase.execute({ associationId, status, role, search });
  }

  @Get('associations/:associationId/members/:memberId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed info & interaction history for a member' })
  async getMemberDetails(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.getMemberDetailsUseCase.execute({
      associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
    });
  }

  @Patch('associations/:associationId/members/:memberId/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member profile details (Self or President/Secretary)' })
  async updateProfile(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() profileData: any,
  ) {
    return this.updateMemberProfileUseCase.execute({
      associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
      profileData,
    });
  }

  // ─── Invitations ───────────────────────────────────────────────────────────

  @Post('associations/:associationId/members/invite')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new member via email or phone' })
  async inviteMember(
    @Param('associationId') associationId: string,
    @Request() req: any,
    @Body() body: { email?: string; phone?: string; role?: AssociationRole },
  ) {
    return this.inviteMemberUseCase.execute({
      associationId,
      invitedByUserId: req.user.sub,
      email: body.email,
      phone: body.phone,
      role: body.role,
    });
  }

  @Post('associations/:associationId/members/manual')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new member manually (President/Secretary only)' })
  async addMemberManually(
    @Param('associationId') associationId: string,
    @Request() req: any,
    @Body() body: { firstName: string; lastName: string; email?: string; phone?: string; role?: AssociationRole },
  ) {
    return this.addMemberManuallyUseCase.execute({
      associationId,
      actorUserId: req.user.sub,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      role: body.role,
    });
  }

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Inspect an invitation token details (Public)' })
  async getInvitationDetails(@Param('token') token: string) {
    return this.acceptInvitationUseCase.getInvitationDetails(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept invitation and join association (Logged in user)' })
  async acceptInvitation(@Param('token') token: string, @Request() req: any) {
    return this.acceptInvitationUseCase.execute({
      token,
      userId: req.user.sub,
    });
  }

  // ─── Member Status ─────────────────────────────────────────────────────────

  @Patch('associations/:associationId/members/:memberId/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member status or role (President only)' })
  async updateStatus(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() body: { status: MemberStatus; role?: AssociationRole },
  ) {
    return this.updateMemberStatusUseCase.execute({
      associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
      status: body.status,
      role: body.role,
    });
  }

  // ─── Joining Fee ───────────────────────────────────────────────────────────

  @Post('associations/:associationId/members/:memberId/joining-fee')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate joining fee payment for a member (President/Treasurer only)' })
  async validateJoiningFee(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.validateJoiningFeeUseCase.execute({
      associationId,
      memberUserId: memberId,
      validatedByUserId: req.user.sub,
    });
  }

  // ─── Proxy / Procuration ───────────────────────────────────────────────────

  @Patch('associations/:associationId/members/:memberId/proxy')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign or update a proxy (mandataire) for a member' })
  async assignProxy(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Body()
    body: {
      proxyName?: string;
      proxyPhone?: string;
      proxyNotes?: string;
      expiresAt?: string;
    },
  ) {
    return this.assignProxyUseCase.execute({
      associationId,
      memberId,
      proxyName: body.proxyName,
      proxyPhone: body.proxyPhone,
      proxyNotes: body.proxyNotes,
      expiresAt: body.expiresAt,
    });
  }

  @Delete('associations/:associationId/members/:memberId/proxy')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the active proxy for a member' })
  async revokeProxy(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.revokeProxyUseCase.execute({ associationId, memberId });
  }

  // ─── Certificates / Attestations ───────────────────────────────────────────

  @Post('associations/:associationId/members/:memberId/certificate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate member certificate of good standing (QR Token, 1 year)' })
  async generateCertificate(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    // associationId peut être un slug — on passe les deux
    return this.generateCertificateUseCase.execute({
      associationId,
      memberId,
      associationSlug: associationId,
    });
  }

  @Get('associations/:associationId/members/:memberId/certificates')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all certificates issued for a member' })
  async listCertificates(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.generateCertificateUseCase.listByMember(memberId, associationId);
  }

  @Get('certificates/verify/:token')
  @ApiOperation({ summary: 'Public endpoint to verify a member certificate' })
  async verifyCertificate(@Param('token') token: string) {
    return this.generateCertificateUseCase.verify(token);
  }

  @Patch('associations/:associationId/certificates/:certificateId/revoke')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate/Revoke a certificate (President & Secretary only)' })
  async revokeCertificate(
    @Param('associationId') associationId: string,
    @Param('certificateId') certificateId: string,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    return this.revokeCertificateUseCase.execute({
      associationId,
      certificateId,
      actorUserId: req.user.sub,
      reason: body.reason,
    });
  }
}
