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
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

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
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
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
  @Roles()
  async listResolutions(@Param('associationId') associationId: string, @Request() req?: any) {
    return this.listResolutionsUseCase.execute(req?.resolvedAssociationId || associationId);
  }

  @Get(':resolutionId')
  @Roles()
  async getResolutionDetails(@Param('resolutionId') resolutionId: string) {
    return this.getResolutionDetailsUseCase.execute(resolutionId);
  }

  @Post()
  @Roles('SECRETARY')
  async createResolution(
    @Param('associationId') associationId: string,
    @Body() dto: CreateResolutionDto,
    @Request() req: any,
  ) {
    const resolution = await this.createResolutionUseCase.execute({
      ...dto,
      associationId: req.resolvedAssociationId || associationId,
    });
    return resolution.toJSON();
  }

  @Post(':resolutionId/vote')
  @Roles()
  async castVote(
    @Param('associationId') associationId: string,
    @Param('resolutionId') resolutionId: string,
    @Body() dto: CastVoteDto,
    @Request() req: any,
  ) {
    const membership = req.membership;
    if (!membership) throw new BadRequestException('Vous n\'êtes pas un membre actif habilité à voter.');

    return this.castVoteUseCase.execute({
      resolutionId,
      voterMemberId: membership.id,
      choice: dto.choice,
    });
  }

  @Post(':resolutionId/close')
  @Roles('SECRETARY')
  async closeResolution(@Param('resolutionId') resolutionId: string) {
    return this.closeResolutionUseCase.execute(resolutionId);
  }
}
