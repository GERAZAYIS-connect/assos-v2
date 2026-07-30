import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../../application/services/admin.service';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';

@ApiTags('admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard('jwt'), PlatformAdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics (Super Admin)' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('associations')
  @ApiOperation({ summary: 'Get all hosted associations with stats (Super Admin)' })
  async getAssociations() {
    return this.adminService.getHostedAssociations();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get global platform audit logs (Super Admin)' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
