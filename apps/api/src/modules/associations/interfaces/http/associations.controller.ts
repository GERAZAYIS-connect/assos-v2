import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateAssociationUseCase } from '../../application/use-cases/create-association.use-case';
import { UpdateAssociationUseCase } from '../../application/use-cases/update-association.use-case';
import { ExportAssociationDataUseCase } from '../../application/use-cases/export-association-data.use-case';
import { CreateAssociationDto } from './dtos/create-association.dto';
import { UpdateAssociationDto } from './dtos/update-association.dto';
import { TokenPayload } from '../../../auth/domain/ports/token.service.interface';
import { ASSOCIATION_REPOSITORY, IAssociationRepository } from '../../domain/repositories/association.repository.interface';
import { Inject } from '@nestjs/common';

@ApiTags('associations')
@Controller({ path: 'associations', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AssociationsController {
  constructor(
    private readonly createAssocUseCase: CreateAssociationUseCase,
    private readonly updateAssocUseCase: UpdateAssociationUseCase,
    private readonly exportAssocDataUseCase: ExportAssociationDataUseCase,
    @Inject(ASSOCIATION_REPOSITORY) private readonly assocRepo: IAssociationRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new association (caller becomes PRESIDENT)' })
  async create(@Body() dto: CreateAssociationDto, @Request() req: { user: TokenPayload }) {
    return this.createAssocUseCase.execute({
      name: dto.name,
      slug: dto.slug,
      currency: dto.currency,
      country: dto.country,
      language: dto.language,
      creatorUserId: req.user.sub,
    });
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get all associations the current user belongs to with role' })
  async getMyAssociations(@Request() req: { user: TokenPayload }) {
    const memberships = await this.assocRepo.findByMemberIdWithRole(req.user.sub);
    return memberships.map((m) => ({
      ...m.association,
      role: m.role,
      memberId: m.memberId,
    }));
  }

  @Get('check-slug/:slug')
  @ApiOperation({ summary: 'Check if a slug is available (real-time)' })
  async checkSlug(@Request() req: { params: { slug: string } }) {
    const exists = await this.assocRepo.slugExists(req.params.slug);
    return { available: !exists };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update association settings (President only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssociationDto,
    @Request() req: { user: TokenPayload }
  ) {
    return this.updateAssocUseCase.execute({
      associationId: id,
      userId: req.user.sub,
      data: dto,
    });
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export all association data (President, Secretary, Treasurer)' })
  async exportData(
    @Param('id') id: string,
    @Request() req: { user: TokenPayload }
  ) {
    return this.exportAssocDataUseCase.execute({
      associationId: id,
      userId: req.user.sub,
    });
  }
}
