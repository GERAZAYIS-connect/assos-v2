import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { IssueSanctionUseCase } from '../../application/use-cases/issue-sanction.use-case';
import { PaySanctionUseCase } from '../../application/use-cases/pay-sanction.use-case';
import { CancelSanctionUseCase } from '../../application/use-cases/cancel-sanction.use-case';
import { ListSanctionsUseCase } from '../../application/use-cases/list-sanctions.use-case';
import { CheckOverdueSanctionsUseCase } from '../../application/use-cases/check-overdue-sanctions.use-case';
import { SanctionStatus, SanctionSeverity } from '@prisma/client';
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

class IssueSanctionDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fineAmount?: number;

  @IsEnum(SanctionSeverity)
  @IsOptional()
  severity?: SanctionSeverity;
}

class PaySanctionDto {
  @IsString()
  @IsNotEmpty()
  caisseId: string;
}

class CancelSanctionDto {
  @IsEnum(['CANCEL', 'EXCUSE'])
  actionType: 'CANCEL' | 'EXCUSE';
}

@Controller('associations/:associationId/sanctions')
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
export class SanctionsController {
  constructor(
    private readonly issueSanctionUseCase: IssueSanctionUseCase,
    private readonly paySanctionUseCase: PaySanctionUseCase,
    private readonly cancelSanctionUseCase: CancelSanctionUseCase,
    private readonly listSanctionsUseCase: ListSanctionsUseCase,
    private readonly checkOverdueSanctionsUseCase: CheckOverdueSanctionsUseCase,
  ) {}

  /**
   * GET /sanctions
   * PRESIDENT / TREASURER / SECRETARY / CENSOR → toutes les sanctions.
   * MEMBER → uniquement ses propres sanctions.
   */
  @Get()
  @Roles() // Tous les membres actifs autorisés
  async listSanctions(
    @Param('associationId') associationId: string,
    @Query('status') status?: SanctionStatus,
    @Request() req?: any,
  ) {
    const membership = req?.membership;
    const memberId = membership?.role === 'MEMBER' ? membership.id : undefined;

    return this.listSanctionsUseCase.execute({
      associationId: req?.resolvedAssociationId || associationId,
      status,
      memberId, // Undefined pour le bureau → tous, renseigné pour MEMBER → seulement les siennes
    });
  }

  /**
   * POST /sanctions/check-overdue
   * CENSOR + PRESIDENT (discipline)
   */
  @Post('check-overdue')
  @Roles('CENSOR', 'TREASURER')
  async checkOverdue(
    @Param('associationId') associationId: string,
    @Query('thresholdDays') thresholdDays?: string,
  ) {
    return this.checkOverdueSanctionsUseCase.execute({
      thresholdDays: thresholdDays ? parseInt(thresholdDays, 10) : undefined,
    });
  }

  /**
   * POST /sanctions/issue
   * CENSOR + PRESIDENT uniquement (pouvoir disciplinaire)
   */
  @Post('issue')
  @Roles('CENSOR')
  async issueSanction(
    @Param('associationId') associationId: string,
    @Body() dto: IssueSanctionDto,
    @Request() req: any,
  ) {
    const sanction = await this.issueSanctionUseCase.execute({
      ...dto,
      associationId: req.resolvedAssociationId || associationId,
      issuedByUserId: req.user?.id,
    });
    return sanction.toJSON();
  }

  /**
   * POST /sanctions/:id/pay
   * TREASURER + PRESIDENT (acte financier)
   */
  @Post(':sanctionId/pay')
  @Roles('TREASURER')
  async paySanction(
    @Param('associationId') associationId: string,
    @Param('sanctionId') sanctionId: string,
    @Body() dto: PaySanctionDto,
    @Request() req: any,
  ) {
    const sanction = await this.paySanctionUseCase.execute({
      sanctionId,
      associationId: req.resolvedAssociationId || associationId,
      caisseId: dto.caisseId,
      paidByUserId: req.user?.id,
    });
    return sanction.toJSON();
  }

  /**
   * POST /sanctions/:id/cancel
   * CENSOR + PRESIDENT uniquement (pouvoir disciplinaire)
   */
  @Post(':sanctionId/cancel')
  @Roles('CENSOR')
  async cancelSanction(
    @Param('associationId') associationId: string,
    @Param('sanctionId') sanctionId: string,
    @Body() dto: CancelSanctionDto,
    @Request() req: any,
  ) {
    const sanction = await this.cancelSanctionUseCase.execute({
      sanctionId,
      actionType: dto.actionType,
    });
    return sanction.toJSON();
  }
}
