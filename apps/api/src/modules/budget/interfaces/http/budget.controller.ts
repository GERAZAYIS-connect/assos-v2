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

  @Get('associations/:associationId/budgets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all annual budgets' })
  async listAnnualBudgets(@Param('associationId') associationId: string) {
    return this.budgetRepository.listAnnualBudgets(associationId);
  }

  @Get('associations/:associationId/budgets/:year')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get budget details and execution stats for a year' })
  async getBudgetExecutionStats(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');
    return this.budgetRepository.getBudgetExecutionStats(associationId, year);
  }

  @Post('associations/:associationId/budgets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create annual budget' })
  async createAnnualBudget(
    @Param('associationId') associationId: string,
    @Body() dto: CreateAnnualBudgetDto,
    @Request() req: any,
  ) {
    // RBAC: Check if user is Bureau member
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
      select: { id: true },
    });
    if (!assoc) throw new BadRequestException('Association introuvable.');

    const member = await this.prisma.associationMember.findFirst({
      where: { associationId: assoc.id, userId: req.user?.id, status: 'ACTIVE' },
    });

    if (!member || (member.role !== 'PRESIDENT' && member.role !== 'TREASURER' && member.role !== 'SECRETARY')) {
      throw new ForbiddenException('Seuls les membres du Bureau sont habilités à gérer le budget prévisionnel.');
    }

    return this.budgetRepository.createAnnualBudget({
      ...dto,
      associationId: assoc.id,
    });
  }

  @Post('associations/:associationId/budgets/:year/simulate-profit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate Cassation profit distribution' })
  async simulateProfitDistribution(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
    @Body() dto: SimulateProfitDistributionDto,
    @Request() req: any,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');

    return this.budgetRepository.calculateProfitDistribution({
      associationId,
      year,
      baseUnitAmount: dto.baseUnitAmount,
      partyExpenses: dto.partyExpenses,
      retainedReserve: dto.retainedReserve,
    });
  }

  @Post('associations/:associationId/budgets/:year/execute-profit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute Cassation profit distribution' })
  async executeProfitDistribution(
    @Param('associationId') associationId: string,
    @Param('year') yearStr: string,
    @Body() dto: SimulateProfitDistributionDto,
    @Request() req: any,
  ) {
    const year = parseInt(yearStr, 10);
    if (isNaN(year)) throw new BadRequestException('Année invalide.');

    // RBAC check
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
      select: { id: true },
    });
    if (!assoc) throw new BadRequestException('Association introuvable.');

    const member = await this.prisma.associationMember.findFirst({
      where: { associationId: assoc.id, userId: req.user?.id, status: 'ACTIVE' },
    });

    if (!member || (member.role !== 'PRESIDENT' && member.role !== 'TREASURER')) {
      throw new ForbiddenException('Seuls le Président et le Trésorier peuvent valider la redistribution des bénéfices.');
    }

    return this.budgetRepository.executeProfitDistribution(
      {
        associationId: assoc.id,
        year,
        baseUnitAmount: dto.baseUnitAmount,
        partyExpenses: dto.partyExpenses,
        retainedReserve: dto.retainedReserve,
      },
      req.user?.id,
    );
  }

  @Get('associations/:associationId/profit-distributions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all historical profit distributions' })
  async listProfitDistributions(@Param('associationId') associationId: string) {
    return this.budgetRepository.listProfitDistributions(associationId);
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
