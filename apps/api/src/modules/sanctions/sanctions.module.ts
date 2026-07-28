import { Module } from '@nestjs/common';
import { SanctionsController } from './interfaces/http/sanctions.controller';
import { IssueSanctionUseCase } from './application/use-cases/issue-sanction.use-case';
import { PaySanctionUseCase } from './application/use-cases/pay-sanction.use-case';
import { CancelSanctionUseCase } from './application/use-cases/cancel-sanction.use-case';
import { ListSanctionsUseCase } from './application/use-cases/list-sanctions.use-case';
import { CheckOverdueSanctionsUseCase } from './application/use-cases/check-overdue-sanctions.use-case';
import { PrismaSanctionRepository } from './infrastructure/repositories/prisma-sanction.repository';
import { TreasuryModule } from '../treasury/treasury.module';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  imports: [TreasuryModule],
  controllers: [SanctionsController],
  providers: [
    {
      provide: 'ISanctionRepository',
      useClass: PrismaSanctionRepository,
    },
    PrismaService,
    IssueSanctionUseCase,
    PaySanctionUseCase,
    CancelSanctionUseCase,
    ListSanctionsUseCase,
    CheckOverdueSanctionsUseCase,
  ],
  exports: ['ISanctionRepository'],
})
export class SanctionsModule {}
