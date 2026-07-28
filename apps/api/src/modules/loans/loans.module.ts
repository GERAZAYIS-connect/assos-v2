import { Module } from '@nestjs/common';
import { LoansController } from './interfaces/http/loans.controller';
import { RequestLoanUseCase } from './application/use-cases/request-loan.use-case';
import { ApproveLoanUseCase } from './application/use-cases/approve-loan.use-case';
import { RejectLoanUseCase } from './application/use-cases/reject-loan.use-case';
import { RepayLoanUseCase } from './application/use-cases/repay-loan.use-case';
import { ListLoansUseCase } from './application/use-cases/list-loans.use-case';
import { GetLoanDetailsUseCase } from './application/use-cases/get-loan-details.use-case';
import { RecordInformalReminderUseCase } from './application/use-cases/record-informal-reminder.use-case';
import { CheckPendingLoansUrgencyUseCase } from './application/use-cases/check-pending-loans-urgency.use-case';
import { PrismaLoanRepository } from './infrastructure/repositories/prisma-loan.repository';
import { TreasuryModule } from '../treasury/treasury.module';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  imports: [TreasuryModule],
  controllers: [LoansController],
  providers: [
    {
      provide: 'ILoanRepository',
      useClass: PrismaLoanRepository,
    },
    PrismaService,
    RequestLoanUseCase,
    ApproveLoanUseCase,
    RejectLoanUseCase,
    RepayLoanUseCase,
    ListLoansUseCase,
    GetLoanDetailsUseCase,
    RecordInformalReminderUseCase,
    CheckPendingLoansUrgencyUseCase,
  ],
  exports: ['ILoanRepository'],
})
export class LoansModule {}
