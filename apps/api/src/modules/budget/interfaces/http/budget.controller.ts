import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { BUDGET_REPOSITORY, IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BudgetItemType, BudgetStatus } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

export class CreateBudgetItemDto {
  @IsOptional()
  @IsString()
  caisseId?: string;

  @IsEnum(BudgetItemType)
  type: BudgetItemType;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0)
  estimatedAmount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateAnnualBudgetDto {
  @IsNumber()
  year: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  items?: CreateBudgetItemDto[];
}

export class SimulateProfitDistributionDto {
  @IsOptional()
  @IsNumber()
  @Min(100)
  baseUnitAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partyExpenses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retainedReserve?: number;
}

@ApiTags('Budget & Financial Reports')
@Controller({ version: '1' })
export class BudgetController {
  constructor(
    @Inject(BUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
    private readonly prisma: PrismaService,
  ) {}

  /** GET budgets — TREASURER + PRESIDENT */
  @Get('associations/:associationId/budgets')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all annual budgets' })
  async listAnnualBudgets(@Param('associationId') associationId: string, @Request() req?: any) {
    return this.budgetRepository.listAnnualBudgets(req?.resolvedAssociationId || associationId);
  }

  /** GET budget year stats — TREASURER + PRESIDENT */
  @Get('associations/:associationId/budgets/:year')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get budget execution stats for a year' })
  async getBudgetExecutionStats(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
    @Request() req?: any,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');
    return this.budgetRepository.getBudgetExecutionStats(req?.resolvedAssociationId || associationId, year);
  }

  /** POST create budget — TREASURER + PRESIDENT */
  @Post('associations/:associationId/budgets')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create annual budget' })
  async createAnnualBudget(
    @Param('associationId') associationId: string,
    @Body() dto: CreateAnnualBudgetDto,
    @Request() req: any,
  ) {
    return this.budgetRepository.createAnnualBudget({
      ...dto,
      associationId: req.resolvedAssociationId || associationId,
    });
  }

  /** POST simulate profit — TREASURER + PRESIDENT */
  @Post('associations/:associationId/budgets/:year/simulate-profit')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate Cassation profit distribution (read-only, no DB write)' })
  async simulateProfitDistribution(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
    @Body() dto: SimulateProfitDistributionDto,
    @Request() req: any,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');
    return this.budgetRepository.calculateProfitDistribution({
      associationId: req.resolvedAssociationId || associationId,
      year,
      baseUnitAmount: dto.baseUnitAmount,
      partyExpenses: dto.partyExpenses,
      retainedReserve: dto.retainedReserve,
    });
  }

  /** POST execute profit — PRESIDENT ONLY (acte final irréversible) */
  @Post('associations/:associationId/budgets/:year/execute-profit')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('PRESIDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute Cassation profit distribution (President only)' })
  async executeProfitDistribution(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
    @Body() dto: SimulateProfitDistributionDto,
    @Request() req: any,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');
    return this.budgetRepository.executeProfitDistribution(
      {
        associationId: req.resolvedAssociationId || associationId,
        year,
        baseUnitAmount: dto.baseUnitAmount,
        partyExpenses: dto.partyExpenses,
        retainedReserve: dto.retainedReserve,
      },
      req.user?.id,
    );
  }

  /** GET profit distributions — TREASURER + PRESIDENT */
  @Get('associations/:associationId/profit-distributions')
  @UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
  @Roles('TREASURER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all historical profit distributions' })
  async listProfitDistributions(@Param('associationId') associationId: string, @Request() req?: any) {
    return this.budgetRepository.listProfitDistributions(req?.resolvedAssociationId || associationId);
  }

  @Get('associations/:associationId/budgets/:year/profit-distribution')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Cassation profit distribution details' })
  async getProfitDistribution(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');
    return this.budgetRepository.getProfitDistribution(associationId, year);
  }
}
