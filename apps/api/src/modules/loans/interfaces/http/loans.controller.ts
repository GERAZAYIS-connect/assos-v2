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
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';
import { RequestLoanUseCase } from '../../application/use-cases/request-loan.use-case';
import { ApproveLoanUseCase } from '../../application/use-cases/approve-loan.use-case';
import { RejectLoanUseCase } from '../../application/use-cases/reject-loan.use-case';
import { RepayLoanUseCase } from '../../application/use-cases/repay-loan.use-case';
import { ListLoansUseCase } from '../../application/use-cases/list-loans.use-case';
import { GetLoanDetailsUseCase } from '../../application/use-cases/get-loan-details.use-case';
import { RecordInformalReminderUseCase } from '../../application/use-cases/record-informal-reminder.use-case';
import { CheckPendingLoansUrgencyUseCase } from '../../application/use-cases/check-pending-loans-urgency.use-case';
import { LoanStatus } from '@prisma/client';
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

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
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
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

  /**
   * GET /loans
   * PRESIDENT + TREASURER → tous les prêts
   * MEMBER → uniquement les siens (filtré par memberId automatiquement)
   */
  @Get()
  @Roles() // Tous les membres actifs autorisés — filtrage en logique ci-dessous
  async listLoans(
    @Param('associationId') associationId: string,
    @Query('status') status?: LoanStatus,
    @Query('memberId') memberId?: string,
    @Request() req?: any,
  ) {
    const membership = req.membership;

    // MEMBER ne voit que ses propres prêts
    if (membership?.role === 'MEMBER' || membership?.role === 'SECRETARY' || membership?.role === 'CENSOR') {
      return this.listLoansUseCase.execute({
        associationId: req.resolvedAssociationId || associationId,
        status,
        memberId: membership.id, // Forcé à son propre membership ID
      });
    }

    // PRESIDENT / TREASURER → visibilité totale avec filtre optionnel
    return this.listLoansUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      status,
      memberId,
    });
  }

  /**
   * GET /loans/:loanId
   * PRESIDENT + TREASURER → tout prêt
   * MEMBER → uniquement ses propres prêts (vérifié dans le use-case)
   */
  @Get(':loanId')
  @Roles() // Filtrage logique en aval
  async getLoanDetails(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const membership = req.membership;
    const loan = await this.getLoanDetailsUseCase.execute(
      req.resolvedAssociationId || associationId,
      loanId,
    );

    // MEMBER : s'assurer que le prêt lui appartient
    if (membership?.role === 'MEMBER' || membership?.role === 'SECRETARY' || membership?.role === 'CENSOR') {
      if (loan?.borrowerMemberId !== membership.id) {
        throw new ForbiddenException('Vous ne pouvez consulter que vos propres prêts.');
      }
    }
    return loan;
  }

  @Post('check-urgency')
  @Roles('TREASURER') // PRESIDENT implicitement via le guard
  async checkUrgency(
    @Param('associationId') associationId: string,
    @Query('thresholdHours') thresholdHours?: string,
  ) {
    return this.checkPendingLoansUrgencyUseCase.execute({
      thresholdHours: thresholdHours ? parseInt(thresholdHours, 10) : undefined,
    });
  }

  /**
   * POST /loans/request
   * Tous les membres actifs peuvent soumettre une demande.
   * MEMBER → borrowerMemberId est automatiquement forcé à son propre membership ID.
   * PRESIDENT / TREASURER → peuvent soumettre pour n'importe quel membre.
   */
  @Post('request')
  @Roles() // Tous les membres autorisés
  async requestLoan(
    @Param('associationId') associationId: string,
    @Body() dto: RequestLoanDto,
    @Request() req: any,
  ) {
    const membership = req.membership;

    // Sécurité : MEMBER ne peut demander que pour lui-même
    if (membership?.role === 'MEMBER' || membership?.role === 'CENSOR') {
      dto.borrowerMemberId = membership.id; // Forcer à son propre ID
    }

    const loan = await this.requestLoanUseCase.execute({
      ...dto,
      associationId: req.resolvedAssociationId || associationId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
    return loan.toJSON();
  }

  /**
   * POST /loans/:loanId/approve
   * PRESIDENT + TREASURER uniquement
   */
  @Post(':loanId/approve')
  @Roles('TREASURER')
  async approveLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const loan = await this.approveLoanUseCase.execute({
      loanId,
      associationId: req.resolvedAssociationId || associationId,
      approvedByUserId: req.user?.id,
    });
    return loan.toJSON();
  }

  /**
   * POST /loans/:loanId/reject
   * PRESIDENT + TREASURER uniquement
   */
  @Post(':loanId/reject')
  @Roles('TREASURER')
  async rejectLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Request() req: any,
  ) {
    const loan = await this.rejectLoanUseCase.execute({
      loanId,
      associationId: req.resolvedAssociationId || associationId,
    });
    return loan.toJSON();
  }

  /**
   * POST /loans/:loanId/repay
   * PRESIDENT + TREASURER uniquement (c'est le trésorier qui enregistre)
   */
  @Post(':loanId/repay')
  @Roles('TREASURER')
  async repayLoan(
    @Param('associationId') associationId: string,
    @Param('loanId') loanId: string,
    @Body() dto: RepayLoanDto,
    @Request() req: any,
  ) {
    const result = await this.repayLoanUseCase.execute({
      loanId,
      associationId: req.resolvedAssociationId || associationId,
      amount: dto.amount,
      notes: dto.notes,
      createdByUserId: req.user?.id,
    });
    return {
      loan: result.loan.toJSON(),
      repayment: result.repayment,
    };
  }

  /**
   * POST /loans/:loanId/informal-reminder
   * PRESIDENT + TREASURER
   */
  @Post(':loanId/informal-reminder')
  @Roles('TREASURER')
  async recordInformalReminder(
    @Param('loanId') loanId: string,
    @Body() dto: RecordReminderDto,
    @Request() req: any,
  ) {
    const loan = await this.recordInformalReminderUseCase.execute({
      loanId,
      notes: dto.notes,
      userId: req.user?.id,
    });
    return loan.toJSON();
  }
}
