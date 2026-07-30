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
  ForbiddenException,
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
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

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

  // ─── Members ────────────────────────────────────────────────────────────────

  /**
   * GET /associations/:associationId/members
   * Tout le bureau + Trésorier peuvent voir la liste.
   * MEMBER simple → interdit (il peut uniquement voir son propre détail).
   */
  @Get('associations/:associationId/members')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER', 'SECRETARY', 'CENSOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all members (Bureau roles only)' })
  async listMembers(
    @Param('associationId') associationId: string,
    @Query('status') status?: MemberStatus,
    @Query('role') role?: AssociationRole,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    return this.listMembersUseCase.execute({
      associationId: req?.resolvedAssociationId || associationId,
      status,
      role,
      search,
    });
  }

  /**
   * GET /associations/:associationId/members/:memberId
   * PRESIDENT / SECRETARY → voir n'importe quel membre.
   * TREASURER / CENSOR → voir n'importe quel membre.
   * MEMBER → uniquement son propre profil.
   */
  @Get('associations/:associationId/members/:memberId')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles() // Autorisé à tous, mais filtré en logique
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get member details (own profile for MEMBER role)' })
  async getMemberDetails(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    const membership = req.membership;

    // MEMBER ne peut voir que son propre profil
    if (membership?.role === 'MEMBER' && membership.id !== memberId) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que votre propre profil. Contactez la Secrétaire pour les informations d\'autres membres.',
      );
    }

    return this.getMemberDetailsUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
    });
  }

  /**
   * PATCH /associations/:associationId/members/:memberId/profile
   * SECRETARY + PRESIDENT uniquement.
   * MEMBER → 403 explicite avec message d'orientation.
   */
  @Patch('associations/:associationId/members/:memberId/profile')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member profile (Secretary or President only)' })
  async updateProfile(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() profileData: any,
  ) {
    return this.updateMemberProfileUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
      profileData,
    });
  }

  // ─── Invitations ────────────────────────────────────────────────────────────

  /**
   * POST /associations/:associationId/members/invite
   * SECRETARY + PRESIDENT
   */
  @Post('associations/:associationId/members/invite')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a new member (Secretary or President only)' })
  async inviteMember(
    @Param('associationId') associationId: string,
    @Request() req: any,
    @Body() body: { email?: string; phone?: string; role?: AssociationRole },
  ) {
    return this.inviteMemberUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      invitedByUserId: req.user.sub,
      email: body.email,
      phone: body.phone,
      role: body.role,
    });
  }

  /**
   * POST /associations/:associationId/members/manual
   * SECRETARY + PRESIDENT uniquement
   */
  @Post('associations/:associationId/members/manual')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add member manually (Secretary or President only)' })
  async addMemberManually(
    @Param('associationId') associationId: string,
    @Request() req: any,
    @Body() body: { firstName: string; lastName: string; email?: string; phone?: string; role?: AssociationRole },
  ) {
    return this.addMemberManuallyUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      actorUserId: req.user.sub,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      role: body.role,
    });
  }

  // Routes publiques d'invitation (pas de guard d'association requis)

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Inspect an invitation token (Public)' })
  async getInvitationDetails(@Param('token') token: string) {
    return this.acceptInvitationUseCase.getInvitationDetails(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept invitation and join association' })
  async acceptInvitation(@Param('token') token: string, @Request() req: any) {
    return this.acceptInvitationUseCase.execute({
      token,
      userId: req.user.sub,
    });
  }

  // ─── Member Status ──────────────────────────────────────────────────────────

  /**
   * PATCH /members/:memberId/status
   * PRESIDENT uniquement (AssociationRoleGuard avec PRESIDENT implicite)
   */
  @Patch('associations/:associationId/members/:memberId/status')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('PRESIDENT') // Le guard autorise PRESIDENT par défaut
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member status or role (President only)' })
  async updateStatus(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() body: { status: MemberStatus; role?: AssociationRole },
  ) {
    return this.updateMemberStatusUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      actorUserId: req.user.sub,
      targetMemberId: memberId,
      status: body.status,
      role: body.role,
    });
  }

  // ─── Joining Fee ────────────────────────────────────────────────────────────

  /**
   * POST /members/:memberId/joining-fee
   * PRESIDENT + TREASURER
   */
  @Post('associations/:associationId/members/:memberId/joining-fee')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate joining fee (President or Treasurer)' })
  async validateJoiningFee(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.validateJoiningFeeUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      memberUserId: memberId,
      validatedByUserId: req.user.sub,
    });
  }

  // ─── Proxy / Procuration ────────────────────────────────────────────────────

  /**
   * PATCH /members/:memberId/proxy
   * SECRETARY + PRESIDENT (la procuration est un acte administratif)
   */
  @Patch('associations/:associationId/members/:memberId/proxy')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign proxy for a member (Secretary or President)' })
  async assignProxy(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
    @Body() body: { proxyName?: string; proxyPhone?: string; proxyNotes?: string; expiresAt?: string },
  ) {
    return this.assignProxyUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      memberId,
      proxyName: body.proxyName,
      proxyPhone: body.proxyPhone,
      proxyNotes: body.proxyNotes,
      expiresAt: body.expiresAt,
    });
  }

  @Delete('associations/:associationId/members/:memberId/proxy')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke proxy (Secretary or President)' })
  async revokeProxy(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.revokeProxyUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      memberId,
    });
  }

  // ─── Certificates ───────────────────────────────────────────────────────────

  /**
   * POST /members/:memberId/certificate
   * SECRETARY + PRESIDENT (acte administratif)
   */
  @Post('associations/:associationId/members/:memberId/certificate')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate member certificate (Secretary or President)' })
  async generateCertificate(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.generateCertificateUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      memberId,
      associationSlug: associationId,
    });
  }

  /**
   * GET /members/:memberId/certificates
   * Tout membre actif peut voir ses propres certificats, bureau peut voir tous.
   */
  @Get('associations/:associationId/members/:memberId/certificates')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List certificates for a member' })
  async listCertificates(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    const membership = req.membership;
    // MEMBER ne peut voir que ses propres certificats
    if (membership?.role === 'MEMBER' && membership.id !== memberId) {
      throw new ForbiddenException('Vous ne pouvez consulter que vos propres certificats.');
    }
    return this.generateCertificateUseCase.listByMember(
      memberId,
      req.resolvedAssociationId || associationId,
    );
  }

  @Get('certificates/verify/:token')
  @ApiOperation({ summary: 'Public: verify a member certificate' })
  async verifyCertificate(@Param('token') token: string) {
    return this.generateCertificateUseCase.verify(token);
  }

  @Patch('associations/:associationId/certificates/:certificateId/revoke')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('SECRETARY')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a certificate (Secretary or President)' })
  async revokeCertificate(
    @Param('associationId') associationId: string,
    @Param('certificateId') certificateId: string,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    return this.revokeCertificateUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      certificateId,
      actorUserId: req.user.sub,
      reason: body.reason,
    });
  }
}
