import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { IssueSanctionUseCase } from '../../application/use-cases/issue-sanction.use-case';
import { PaySanctionUseCase } from '../../application/use-cases/pay-sanction.use-case';
import { CancelSanctionUseCase } from '../../application/use-cases/cancel-sanction.use-case';
import { ListSanctionsUseCase } from '../../application/use-cases/list-sanctions.use-case';
import { CheckOverdueSanctionsUseCase } from '../../application/use-cases/check-overdue-sanctions.use-case';
import { SanctionStatus, SanctionSeverity } from '@prisma/client';

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
@UseGuards(AuthGuard('jwt'))
export class SanctionsController {
  constructor(
    private readonly issueSanctionUseCase: IssueSanctionUseCase,
    private readonly paySanctionUseCase: PaySanctionUseCase,
    private readonly cancelSanctionUseCase: CancelSanctionUseCase,
    private readonly listSanctionsUseCase: ListSanctionsUseCase,
    private readonly checkOverdueSanctionsUseCase: CheckOverdueSanctionsUseCase,
  ) {}

  @Get()
  async listSanctions(
    @Param('associationId') associationId: string,
    @Query('status') status?: SanctionStatus,
  ) {
    return this.listSanctionsUseCase.execute({ associationId, status });
  }

  @Post('check-overdue')
  async checkOverdue(
    @Param('associationId') associationId: string,
    @Query('thresholdDays') thresholdDays?: string,
  ) {
    return this.checkOverdueSanctionsUseCase.execute({
      thresholdDays: thresholdDays ? parseInt(thresholdDays, 10) : undefined,
    });
  }

  @Post('issue')
  async issueSanction(
    @Param('associationId') associationId: string,
    @Body() dto: IssueSanctionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const sanction = await this.issueSanctionUseCase.execute({
      ...dto,
      associationId,
      issuedByUserId: userId,
    });
    return sanction.toJSON();
  }

  @Post(':sanctionId/pay')
  async paySanction(
    @Param('associationId') associationId: string,
    @Param('sanctionId') sanctionId: string,
    @Body() dto: PaySanctionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const sanction = await this.paySanctionUseCase.execute({
      sanctionId,
      associationId,
      caisseId: dto.caisseId,
      paidByUserId: userId,
    });
    return sanction.toJSON();
  }

  @Post(':sanctionId/cancel')
  async cancelSanction(
    @Param('sanctionId') sanctionId: string,
    @Body() dto: CancelSanctionDto,
  ) {
    const sanction = await this.cancelSanctionUseCase.execute({
      sanctionId,
      actionType: dto.actionType,
    });
    return sanction.toJSON();
  }
}
