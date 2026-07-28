import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
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
@UseGuards(AuthGuard('jwt'))
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
  async listTontines(
    @Param('associationId') associationId: string,
    @Query('memberId') memberId?: string,
  ) {
    const list = await this.listTontinesUseCase.execute({ associationId, memberId });
    return list.map((t) => t.toJSON());
  }

  @Get(':tontineId')
  async getTontineDetails(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
  ) {
    return this.getTontineDetailsUseCase.execute(associationId, tontineId);
  }

  @Post()
  async createTontine(
    @Param('associationId') associationId: string,
    @Body() dto: CreateTontineDto,
  ) {
    const tontine = await this.createTontineUseCase.execute({
      ...dto,
      associationId,
    });
    return tontine.toJSON();
  }

  @Post(':tontineId/simulate-auction')
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
  async startMeeting(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
    @Body() dto: StartMeetingDto,
  ) {
    return this.startTontineMeetingUseCase.execute({
      associationId,
      tontineId,
      location: dto.location,
      title: dto.title,
    });
  }

  @Post('rounds/:roundId/pay')
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
  async renewTontine(
    @Param('associationId') associationId: string,
    @Param('tontineId') tontineId: string,
  ) {
    return this.renewTontineUseCase.execute(tontineId);
  }
}
