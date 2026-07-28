import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DepositSavingsUseCase } from '../../application/use-cases/deposit-savings.use-case';
import { WithdrawSavingsUseCase } from '../../application/use-cases/withdraw-savings.use-case';
import { GetMemberSavingsBalanceUseCase } from '../../application/use-cases/get-member-savings-balance.use-case';
import { SimulateSavingsInterestUseCase } from '../../application/use-cases/simulate-savings-interest.use-case';
import { ApplySavingsInterestUseCase } from '../../application/use-cases/apply-savings-interest.use-case';

@ApiTags('Savings')
@Controller()
export class SavingsController {
  constructor(
    private readonly depositSavingsUseCase: DepositSavingsUseCase,
    private readonly withdrawSavingsUseCase: WithdrawSavingsUseCase,
    private readonly getMemberSavingsBalanceUseCase: GetMemberSavingsBalanceUseCase,
    private readonly simulateSavingsInterestUseCase: SimulateSavingsInterestUseCase,
    private readonly applySavingsInterestUseCase: ApplySavingsInterestUseCase,
  ) {}

  @Post('associations/:associationId/caisses/:caisseId/savings/deposit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deposit savings for a member' })
  async depositSavings(
    @Param('associationId') associationId: string,
    @Param('caisseId') caisseId: string,
    @Request() req: any,
    @Body() body: { memberId: string; amount: number; description?: string; receiptUrl?: string },
  ) {
    return this.depositSavingsUseCase.execute({
      associationId,
      caisseId,
      memberId: body.memberId,
      amount: body.amount,
      description: body.description,
      receiptUrl: body.receiptUrl,
      actorUserId: req.user.sub,
    });
  }

  @Post('associations/:associationId/caisses/:caisseId/savings/withdraw')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw savings for a member' })
  async withdrawSavings(
    @Param('associationId') associationId: string,
    @Param('caisseId') caisseId: string,
    @Request() req: any,
    @Body() body: { memberId: string; amount: number; description?: string; receiptUrl?: string },
  ) {
    return this.withdrawSavingsUseCase.execute({
      associationId,
      caisseId,
      memberId: body.memberId,
      amount: body.amount,
      description: body.description,
      receiptUrl: body.receiptUrl,
      actorUserId: req.user.sub,
    });
  }

  @Get('associations/:associationId/members/:memberId/savings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total savings balance for a member' })
  async getSavingsBalance(
    @Param('associationId') associationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.getMemberSavingsBalanceUseCase.execute({
      associationId,
      memberId,
    });
  }

  @Get('associations/:associationId/caisses/:caisseId/members/:memberId/savings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get savings balance for a member in a specific caisse' })
  async getSavingsBalanceInCaisse(
    @Param('associationId') associationId: string,
    @Param('caisseId') caisseId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.getMemberSavingsBalanceUseCase.execute({
      associationId,
      memberId,
      caisseId,
    });
  }

  @Post('associations/:associationId/savings/simulate-interest')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate annual savings interest distribution per member' })
  async simulateSavingsInterest(@Param('associationId') associationId: string) {
    return this.simulateSavingsInterestUseCase.execute(associationId);
  }

  @Post('associations/:associationId/savings/apply-interest')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute interest distribution into members savings accounts' })
  async applySavingsInterest(
    @Param('associationId') associationId: string,
    @Request() req: any,
  ) {
    return this.applySavingsInterestUseCase.execute(associationId, req.user.sub);
  }
}

