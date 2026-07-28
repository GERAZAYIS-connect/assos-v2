import { Module } from '@nestjs/common';
import { TontinesController } from './interfaces/http/tontines.controller';
import { CreateTontineUseCase } from './application/use-cases/create-tontine.use-case';
import { PayTontineContributionUseCase } from './application/use-cases/pay-tontine-contribution.use-case';
import { AttributeTontinePotUseCase } from './application/use-cases/attribute-tontine-pot.use-case';
import { ListTontinesUseCase } from './application/use-cases/list-tontines.use-case';
import { GetTontineDetailsUseCase } from './application/use-cases/get-tontine-details.use-case';
import { RenewTontineUseCase } from './application/use-cases/renew-tontine.use-case';
import { SimulateTontineAuctionUseCase } from './application/use-cases/simulate-tontine-auction.use-case';
import { StartTontineMeetingUseCase } from './application/use-cases/start-tontine-meeting.use-case';
import { PrismaTontineRepository } from './infrastructure/repositories/prisma-tontine.repository';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [TontinesController],
  providers: [
    {
      provide: 'ITontineRepository',
      useClass: PrismaTontineRepository,
    },
    PrismaService,
    CreateTontineUseCase,
    PayTontineContributionUseCase,
    AttributeTontinePotUseCase,
    ListTontinesUseCase,
    GetTontineDetailsUseCase,
    RenewTontineUseCase,
    SimulateTontineAuctionUseCase,
    StartTontineMeetingUseCase,
  ],
  exports: ['ITontineRepository'],
})
export class TontinesModule {}
