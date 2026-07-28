import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  ForbiddenException,
} from '../../../../core/exceptions/global-exception.filter';
import { Slug } from '../../domain/value-objects/slug.vo';
import {
  ASSOCIATION_REPOSITORY,
  IAssociationRepository,
} from '../../domain/repositories/association.repository.interface';
import { AssociationAggregate } from '../../domain/aggregates/association.aggregate';
import { AuditService } from '../../../../core/audit/audit.service';
import { AuditCategory } from '@prisma/client';

export interface CreateAssociationCommand {
  name: string;
  slug: string;
  currency?: string;
  country?: string;
  language?: string;
  creatorUserId: string;
}

@Injectable()
export class CreateAssociationUseCase {
  constructor(
    @Inject(ASSOCIATION_REPOSITORY) private readonly assocRepo: IAssociationRepository,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: CreateAssociationCommand): Promise<AssociationAggregate> {
    // Validate slug via value object
    const slug = Slug.create(command.slug);

    // Check against reserved slugs
    const reservedSlugs = this.configService.get<string[]>('app.reservedSlugs', []);
    if (reservedSlugs.includes(slug.value)) {
      throw new ForbiddenException(`The slug "${slug.value}" is reserved and cannot be used`);
    }

    // Check uniqueness
    const slugTaken = await this.assocRepo.slugExists(slug.value);
    if (slugTaken) {
      throw new ConflictException(`The slug "${slug.value}" is already taken`);
    }

    const association = await this.assocRepo.create({
      name: command.name,
      slug: slug.value,
      currency: command.currency,
      country: command.country,
      language: command.language,
      creatorUserId: command.creatorUserId,
    });

    await this.auditService.log({
      associationId: association.id,
      actorId: command.creatorUserId,
      category: AuditCategory.ASSOCIATION,
      action: 'ASSOCIATION_CREATED',
      targetType: 'Association',
      targetId: association.id,
      metadata: { slug: association.slug, name: association.name },
    });

    return association;
  }
}
