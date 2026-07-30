import { Body, Controller, Post, Get, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTontineUseCase } from '../../application/use-cases/create-tontine.use-case';
import { PayTontineContributionUseCase } from '../../application/use-cases/pay-tontine-contribution.use-case';
import { AttributeTontinePotUseCase } from '../../application/use-cases/attribute-tontine-pot.use-case';
import { ListTontinesUseCase } from '../../application/use-cases/list-tontines.use-case';
import { GetTontineDetailsUseCase } from '../../application/use-cases/get-tontine-details.use-case';
import { RenewTontineUseCase } from '../../application/use-cases/renew-tontine.use-case';
import { SimulateTontineAuctionUseCase, Bid } from '../../application/use-cases/simulate-tontine-auction.use-case';
import { StartTontineMeetingUseCase } from '../../application/use-cases/start-tontine-meeting.use-case';
import { TontineType, TontineFrequency } from '@prisma/client';
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

class CreateTontineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TontineType)
  @IsOptional()
  type?: TontineType;

  @IsNumber()
  @Min(1)
  amountPerRound: number;

  @IsEnum(TontineFrequency)
  @IsOptional()
  frequency?: TontineFrequency;

  @IsString()
  @IsOptional()
  caisseId?: string;

  @IsArray()
  @IsNotEmpty()
  memberIds: string[];
}

class PayContributionDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

class AttributePotDto {
  @IsString()
  @IsNotEmpty()
  beneficiaryMemberId: string;

  @IsNumber()
  @Min(1)
  potAmount: number;

  @IsNumber()
  @IsOptional()
  auctionAmount?: number;
}

class BidDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

class SimulateAuctionDto {
  @IsNumber()
  @Min(1)
  amountPerRound: number;

  @IsNumber()
  @Min(1)
  totalMembers: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidDto)
  bids: BidDto[];
}

class StartMeetingDto {
  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

@Controller('associations/:associationId/tontines')
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
export class TontinesController {
  constructor(
    private readonly createTontineUseCase: CreateTontineUseCase,
    private readonly payTontineContributionUseCase: PayTontineContributionUseCase,
    private readonly attributeTontinePotUseCase: AttributeTontinePotUseCase,
    private readonly listTontinesUseCase: ListTontinesUseCase,
    private readonly getTontineDetailsUseCase: GetTontineDetailsUseCase,
    private readonly renewTontineUseCase: RenewTontineUseCase,
    private readonly simulateTontineAuctionUseCase: SimulateTontineAuctionUseCase,
    private readonly startTontineMeetingUseCase: StartTontineMeetingUseCase,
  ) {}

  @Get()
  @Roles()
  async listTontines(
    @Param('associationId') associationId: string,
    @Query('memberId') memberId?: string,
    @Request() req?: any,
  ) {
    const membership = req.membership;
    if (membership?.role === 'MEMBER' || membership?.role === 'CENSOR') {
      const list = await this.listTontinesUseCase.execute({
        associationId: req.resolvedAssociationId || associationId,
        memberId: membership.id,
      });
      return list.map((t) => t.toJSON());
    }

    const list = await this.listTontinesUseCase.execute({
      associationId: req.resolvedAssociationId || associationId,
      memberId,
    });
    return list.map((t) => t.toJSON());
  }

  @Get(':tontineId')
  @Roles()
  async getTontineDetails(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
    @Request() req: any,
  ) {
    const membership = req.membership;
    const tontine = await this.getTontineDetailsUseCase.execute(
      req.resolvedAssociationId || associationId,
      tontineId,
    );

    if (membership?.role === 'MEMBER' || membership?.role === 'CENSOR') {
      const isPart = tontine.members.some((m: any) => m.memberId === membership.id);
      if (!isPart) {
        throw new ForbiddenException("Vous n'êtes pas participant de cette tontine.");
      }
    }
    return tontine;
  }

  @Post()
  @Roles('TREASURER')
  async createTontine(
    @Param('associationId') associationId: string,
    @Body() dto: CreateTontineDto,
    @Request() req?: any,
  ) {
    const tontine = await this.createTontineUseCase.execute({
      ...dto,
      associationId: req?.resolvedAssociationId || associationId,
    });
    return tontine.toJSON();
  }

  @Post(':tontineId/simulate-auction')
  @Roles('TREASURER')
  async simulateAuction(
    @Param('tontineId') tontineId: string,
    @Body() dto: SimulateAuctionDto,
  ) {
    return this.simulateTontineAuctionUseCase.execute({
      tontineId,
      amountPerRound: dto.amountPerRound,
      totalMembers: dto.totalMembers,
      bids: dto.bids,
    });
  }

  @Post(':tontineId/start-meeting')
  @Roles('TREASURER')
  async startMeeting(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
    @Body() dto: StartMeetingDto,
    @Request() req?: any,
  ) {
    return this.startTontineMeetingUseCase.execute({
      associationId: req?.resolvedAssociationId || associationId,
      tontineId,
      location: dto.location,
      title: dto.title,
    });
  }

  @Post('rounds/:roundId/pay')
  @Roles('TREASURER')
  async payContribution(
    @Param('associationId') associationId: string,
    @Param('roundId') roundId: string,
    @Body() dto: PayContributionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.payTontineContributionUseCase.execute({
      roundId,
      memberId: dto.memberId,
      amount: dto.amount,
      createdByUserId: userId,
    });
  }

  @Post('rounds/:roundId/attribute')
  @Roles('TREASURER')
  async attributePot(
    @Param('associationId') associationId: string,
    @Param('roundId') roundId: string,
    @Body() dto: AttributePotDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return this.attributeTontinePotUseCase.execute({
      roundId,
      beneficiaryMemberId: dto.beneficiaryMemberId,
      potAmount: dto.potAmount,
      auctionAmount: dto.auctionAmount,
      createdByUserId: userId,
    });
  }

  @Post(':tontineId/renew')
  @Roles('TREASURER')
  async renewTontine(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
  ) {
    return this.renewTontineUseCase.execute(tontineId);
  }
}
