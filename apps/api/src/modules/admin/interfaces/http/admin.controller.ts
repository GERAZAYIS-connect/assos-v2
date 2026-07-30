import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../../application/services/admin.service';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';

@ApiTags('admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard('jwt'), PlatformAdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Vue d'ensemble
  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics (Super Admin)' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  // 2. Associations enrichies
  @Get('associations')
  @ApiOperation({ summary: 'Get all hosted associations with enriched stats (Super Admin)' })
  async getAssociations() {
    return this.adminService.getHostedAssociations();
  }

  @Post('associations/:id/toggle-status')
  @ApiOperation({ summary: 'Suspend or reactivate an association' })
  async toggleAssociation(@Param('id') id: string) {
    return this.adminService.toggleAssociationStatus(id);
  }

  @Post('associations/:id/subscription')
  @ApiOperation({ summary: 'Update an association subscription plan' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: { plan: string; durationMonths: number },
  ) {
    if (!body.plan || !body.durationMonths) {
      throw new BadRequestException('plan and durationMonths are required.');
    }
    return this.adminService.updateAssociationSubscription(id, body.plan, body.durationMonths);
  }

  // 3. Utilisateurs plateforme
  @Get('users')
  @ApiOperation({ summary: 'Get all platform users with active sessions (Super Admin)' })
  async getUsers() {
    return this.adminService.getPlatformUsers();
  }

  @Post('users/:id/revoke-sessions')
  @ApiOperation({ summary: 'Revoke all active sessions for a user' })
  async revokeUserSessions(@Param('id') id: string) {
    return this.adminService.revokeUserSessions(id);
  }

  // 4. Abonnements & facturation
  @Get('subscriptions')
  @ApiOperation({ summary: 'Get subscription overview for all associations' })
  async getSubscriptions() {
    return this.adminService.getSubscriptionOverview();
  }

  // 5. Métriques SaaS
  @Get('saas-metrics')
  @ApiOperation({ summary: 'Get SaaS business metrics (MRR, ARR, churn, conversion)' })
  async getSaasMetrics() {
    return this.adminService.getSaasMetrics();
  }

  // 6. Anomalies de paiement
  @Get('anomalies')
  @ApiOperation({ summary: 'Get payment anomalies aggregated by association' })
  async getAnomalies() {
    return this.adminService.getPaymentAnomalies();
  }

  // 7. Journaux d'audit filtrables
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get global audit logs with optional filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'associationId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(
    @Query('category') category?: string,
    @Query('associationId') associationId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      category,
      associationId,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }

  // 8. Support — Messages de contact
  @Get('messages')
  @ApiOperation({ summary: 'Get contact messages from the platform' })
  async getMessages() {
    return this.adminService.getContactMessages();
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark a contact message as read' })
  async markMessageRead(@Param('id') id: string) {
    return this.adminService.markMessageRead(id);
  }
}
