import { Module } from '@nestjs/common';
import { GovernanceController } from './interfaces/http/governance.controller';
import { CreateResolutionUseCase } from './application/use-cases/create-resolution.use-case';
import { ListResolutionsUseCase } from './application/use-cases/list-resolutions.use-case';
import { GetResolutionDetailsUseCase } from './application/use-cases/get-resolution-details.use-case';
import { CastVoteUseCase } from './application/use-cases/cast-vote.use-case';
import { CloseResolutionUseCase } from './application/use-cases/close-resolution.use-case';
import { PrismaGovernanceRepository } from './infrastructure/repositories/prisma-governance.repository';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [GovernanceController],
  providers: [
    {
      provide: 'IGovernanceRepository',
      useClass: PrismaGovernanceRepository,
    },
    PrismaService,
    CreateResolutionUseCase,
    ListResolutionsUseCase,
    GetResolutionDetailsUseCase,
    CastVoteUseCase,
    CloseResolutionUseCase,
  ],
  exports: ['IGovernanceRepository'],
})
export class GovernanceModule {}
