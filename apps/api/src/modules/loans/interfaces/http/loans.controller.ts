import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { RequestLoanUseCase } from '../../application/use-cases/request-loan.use-case';
import { ApproveLoanUseCase } from '../../application/use-cases/approve-loan.use-case';
import { RejectLoanUseCase } from '../../application/use-cases/reject-loan.use-case';
import { RepayLoanUseCase } from '../../application/use-cases/repay-loan.use-case';
import { ListLoansUseCase } from '../../application/use-cases/list-loans.use-case';
import { GetLoanDetailsUseCase } from '../../application/use-cases/get-loan-details.use-case';
import { RecordInformalReminderUseCase } from '../../application/use-cases/record-informal-reminder.use-case';
import { CheckPendingLoansUrgencyUseCase } from '../../application/use-cases/check-pending-loans-urgency.use-case';
import { LoanStatus } from '@prisma/client';

class RequestLoanDto {
  @IsString()
  @IsNotEmpty()
  borrowerMemberId: string;

  @IsString()
  @IsOptional()
  guarantorMemberId?: string;

  @IsString()
  @IsNotEmpty()
  caisseId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

class RepayLoanDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

class RecordReminderDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

@Controller('associations/:associationId/loans')
@UseGuards(AuthGuard('jwt'))
export class LoansController {
  constructor(
    private readonly requestLoanUseCase: RequestLoanUseCase,
    private readonly approveLoanUseCase: ApproveLoanUseCase,
    private readonly rejectLoanUseCase: RejectLoanUseCase,
    private readonly repayLoanUseCase: RepayLoanUseCase,
    private readonly listLoansUseCase: ListLoansUseCase,
    private readonly getLoanDetailsUseCase: GetLoanDetailsUseCase,
    private readonly recordInformalReminderUseCase: RecordInformalReminderUseCase,
    private readonly checkPendingLoansUrgencyUseCase: CheckPendingLoansUrgencyUseCase,
  ) {}

  @Get()
  async listLoans(
    @Param('associationId') associationId: string,
    @Query('status') status?: LoanStatus,
    @Query('memberId') memberId?: string,
  ) {
    return this.listLoansUseCase.execute({ associationId, status, memberId });
  }

  @Get(':loanId')
  async getLoanDetails(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.getLoanDetailsUseCase.execute(associationId, loanId);
  }

  @Post('check-urgency')
  async checkUrgency(
    @Param('associationId') associationId: string,
    @Query('thresholdHours') thresholdHours?: string,
  ) {
    return this.checkPendingLoansUrgencyUseCase.execute({
      thresholdHours: thresholdHours ? parseInt(thresholdHours, 10) : undefined,
    });
  }

  @Post('request')
  async requestLoan(
    @Param('associationId') associationId: string,
    @Body() dto: RequestLoanDto,
  ) {
    const loan = await this.requestLoanUseCase.execute({
      ...dto,
      associationId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    return loan.toJSON();
  }

  @Post(':loanId/approve')
  async approveLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const loan = await this.approveLoanUseCase.execute({
      loanId,
      associationId,
      approvedByUserId: userId,
    });
    return loan.toJSON();
  }

  @Post(':loanId/reject')
  async rejectLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
  ) {
    const loan = await this.rejectLoanUseCase.execute({
      loanId,
      associationId,
    });
    return loan.toJSON();
  }

  @Post(':loanId/repay')
  async repayLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Body() dto: RepayLoanDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const result = await this.repayLoanUseCase.execute({
      loanId,
      associationId,
      amount: dto.amount,
      notes: dto.notes,
      createdByUserId: userId,
    });
    return {
      loan: result.loan.toJSON(),
      repayment: result.repayment,
    };
  }

  @Post(':loanId/informal-reminder')
  async recordInformalReminder(
    @Param('loanId') loanId: string,
    @Body() dto: RecordReminderDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const loan = await this.recordInformalReminderUseCase.execute({
      loanId,
      notes: dto.notes,
      userId,
    });
    return loan.toJSON();
  }
}
