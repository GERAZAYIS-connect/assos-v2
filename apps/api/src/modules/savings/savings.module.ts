import { Module } from '@nestjs/common';
import { SavingsController } from './interfaces/http/savings.controller';
import { DepositSavingsUseCase } from './application/use-cases/deposit-savings.use-case';
import { WithdrawSavingsUseCase } from './application/use-cases/withdraw-savings.use-case';
import { GetMemberSavingsBalanceUseCase } from './application/use-cases/get-member-savings-balance.use-case';
import { SimulateSavingsInterestUseCase } from './application/use-cases/simulate-savings-interest.use-case';
import { ApplySavingsInterestUseCase } from './application/use-cases/apply-savings-interest.use-case';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [TreasuryModule],
  controllers: [SavingsController],
  providers: [
    DepositSavingsUseCase,
    WithdrawSavingsUseCase,
    GetMemberSavingsBalanceUseCase,
    SimulateSavingsInterestUseCase,
    ApplySavingsInterestUseCase,
  ],
  exports: [
    DepositSavingsUseCase,
    WithdrawSavingsUseCase,
    GetMemberSavingsBalanceUseCase,
    SimulateSavingsInterestUseCase,
    ApplySavingsInterestUseCase,
  ],
})
export class SavingsModule {}

