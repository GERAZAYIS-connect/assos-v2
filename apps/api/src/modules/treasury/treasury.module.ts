import { Module } from '@nestjs/common';
import { TreasuryController } from './interfaces/http/treasury.controller';
import { CreateCaisseUseCase } from './application/use-cases/create-caisse.use-case';
import { GetCaissesUseCase } from './application/use-cases/get-caisses.use-case';
import { RecordTransactionUseCase } from './application/use-cases/record-transaction.use-case';
import { TransferFundsUseCase } from './application/use-cases/transfer-funds.use-case';
import { GetTransactionUseCase } from './application/use-cases/get-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { PrismaTreasuryRepository } from './infrastructure/repositories/prisma-treasury.repository';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [TreasuryController],
  providers: [
    {
      provide: 'ITreasuryRepository',
      useClass: PrismaTreasuryRepository,
    },
    PrismaService,
    CreateCaisseUseCase,
    RecordTransactionUseCase,
    TransferFundsUseCase,
    GetCaissesUseCase,
    GetTransactionUseCase,
    ListTransactionsUseCase,
  ],
  exports: ['ITreasuryRepository', RecordTransactionUseCase, GetTransactionUseCase, ListTransactionsUseCase],
})
export class TreasuryModule {}
