import { Module } from '@nestjs/common';
import { BudgetController } from './interfaces/http/budget.controller';
import { BUDGET_REPOSITORY } from './domain/repositories/budget.repository.interface';
import { PrismaBudgetRepository } from './infrastructure/repositories/prisma-budget.repository';

@Module({
  controllers: [BudgetController],
  providers: [
    {
      provide: BUDGET_REPOSITORY,
      useClass: PrismaBudgetRepository,
    },
  ],
  exports: [BUDGET_REPOSITORY],
})
export class BudgetModule {}
