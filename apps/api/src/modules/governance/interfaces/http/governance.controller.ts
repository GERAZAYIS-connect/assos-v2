import { Body, Controller, Post, Get, Param, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { CreateResolutionUseCase } from '../../application/use-cases/create-resolution.use-case';
import { ListResolutionsUseCase } from '../../application/use-cases/list-resolutions.use-case';
import { GetResolutionDetailsUseCase } from '../../application/use-cases/get-resolution-details.use-case';
import { CastVoteUseCase } from '../../application/use-cases/cast-vote.use-case';
import { CloseResolutionUseCase } from '../../application/use-cases/close-resolution.use-case';
import { ResolutionCategory, VoteType, VoteChoice, AssociationRole } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

class CreateResolutionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ResolutionCategory)
  @IsOptional()
  category?: ResolutionCategory;

  @IsEnum(VoteType)
  @IsOptional()
  voteType?: VoteType;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  quorumThreshold?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  majorityThreshold?: number;

  @IsEnum(AssociationRole)
  @IsOptional()
  targetRole?: AssociationRole;

  @IsString()
  @IsOptional()
  candidateMemberId?: string;

  @IsString()
  @IsOptional()
  meetingId?: string;
}

class CastVoteDto {
  @IsEnum(VoteChoice)
  choice: VoteChoice;
}

@Controller('associations/:associationId/resolutions')
@UseGuards(AuthGuard('jwt'))
export class GovernanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createResolutionUseCase: CreateResolutionUseCase,
    private readonly listResolutionsUseCase: ListResolutionsUseCase,
    private readonly getResolutionDetailsUseCase: GetResolutionDetailsUseCase,
    private readonly castVoteUseCase: CastVoteUseCase,
    private readonly closeResolutionUseCase: CloseResolutionUseCase,
  ) {}

  @Get()
  async listResolutions(@Param('associationId') associationId: string) {
    return this.listResolutionsUseCase.execute(associationId);
  }

  @Get(':resolutionId')
  async getResolutionDetails(@Param('resolutionId') resolutionId: string) {
    return this.getResolutionDetailsUseCase.execute(resolutionId);
  }

  @Post()
  async createResolution(
    @Param('associationId') associationId: string,
    @Body() dto: CreateResolutionDto,
    @Request() req: any,
  ) {
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
      select: { id: true },
    });
    if (!assoc) throw new BadRequestException('Association introuvable.');

    const member = await this.prisma.associationMember.findFirst({
      where: { associationId: assoc.id, userId: req.user?.id, status: 'ACTIVE' },
    });

    if (!member || (member.role !== 'PRESIDENT' && member.role !== 'SECRETARY' && member.role !== 'TREASURER')) {
      throw new ForbiddenException('Seuls les membres du Bureau (Président, Secrétaire, Trésorier) sont habilités à créer un vote ou une résolution.');
    }

    const resolution = await this.createResolutionUseCase.execute({
      ...dto,
      associationId: assoc.id,
    });
    return resolution.toJSON();
  }

  @Post(':resolutionId/vote')
  async castVote(
    @Param('associationId') associationId: string,
    @Param('resolutionId') resolutionId: string,
    @Body() dto: CastVoteDto,
    @Request() req: any,
  ) {
    // Resolve memberId from current user
    const assoc = await this.prisma.association.findFirst({
      where: { OR: [{ id: associationId }, { slug: associationId }] },
      select: { id: true },
    });
    if (!assoc) throw new BadRequestException('Association introuvable.');

    const member = await this.prisma.associationMember.findFirst({
      where: { associationId: assoc.id, userId: req.user.id, status: 'ACTIVE' },
    });
    if (!member) throw new BadRequestException('Vous n\'êtes pas un membre actif habilité à voter.');

    return this.castVoteUseCase.execute({
      resolutionId,
      voterMemberId: member.id,
      choice: dto.choice,
    });
  }

  @Post(':resolutionId/close')
  async closeResolution(@Param('resolutionId') resolutionId: string) {
    return this.closeResolutionUseCase.execute(resolutionId);
  }
}
