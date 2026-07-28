import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  IAssociationRepository,
} from '../../domain/repositories/association.repository.interface';
import { AssociationAggregate } from '../../domain/aggregates/association.aggregate';
import { Currency, Language, SubscriptionPlan } from '@assos/shared';
import { Association, AssociationRole } from '@prisma/client';
import { MemberNumber } from '../../../members/domain/value-objects/member-number.vo';

@Injectable()
export class PrismaAssociationRepository implements IAssociationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: Association): AssociationAggregate {
    let brandingParsed: Record<string, string> | null = null;
    if (typeof record.branding === 'string') {
      try {
        brandingParsed = JSON.parse(record.branding);
      } catch {
        brandingParsed = null;
      }
    }

    return new AssociationAggregate({
      id: record.id,
      name: record.name,
      slug: record.slug,
      logoUrl: record.logoUrl,
      currency: record.currency as Currency,
      country: record.country,
      language: record.language as Language,
      branding: brandingParsed,
      motto: record.motto,
      savingsInterestRate: record.savingsInterestRate,
      joiningFee: record.joiningFee,
      alertThresholds: record.alertThresholds ? JSON.parse(record.alertThresholds) : null,
      plan: record.plan as SubscriptionPlan,
      isActive: record.isActive,
      createdAt: record.createdAt,
    });
  }

  async findPublic(limit = 20): Promise<{ id: string; name: string; slug: string; logoUrl: string | null; country: string; memberCount: number }[]> {
    const records = await this.prisma.association.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        country: true,
        _count: { select: { members: true } },
      },
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl,
      country: r.country ?? 'CM',
      memberCount: r._count.members,
    }));
  }

  async findById(id: string): Promise<AssociationAggregate | null> {
    const record = await this.prisma.association.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findBySlug(slug: string): Promise<AssociationAggregate | null> {
    const record = await this.prisma.association.findUnique({ where: { slug } });
    return record ? this.toDomain(record) : null;
  }

  async findByMemberId(userId: string): Promise<AssociationAggregate[]> {
    const memberships = await this.prisma.associationMember.findMany({
      where: { userId },
      include: { association: true },
    });
    return memberships.map((m) => this.toDomain(m.association));
  }

  async findByMemberIdWithRole(userId: string): Promise<{ association: AssociationAggregate; role: string; memberId: string }[]> {
    const memberships = await this.prisma.associationMember.findMany({
      where: { userId },
      include: { association: true },
    });
    return memberships.map((m) => ({
      association: this.toDomain(m.association),
      role: m.role,
      memberId: m.id,
    }));
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.association.count({ where: { slug } });
    return count > 0;
  }

  async create(data: {
    name: string;
    slug: string;
    currency?: string;
    country?: string;
    language?: string;
    creatorUserId: string;
  }): Promise<AssociationAggregate> {
    const now = new Date();
    const matricule = MemberNumber.generate(data.name || data.slug, now);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const record = await this.prisma.association.create({
      data: {
        name: data.name,
        slug: data.slug,
        currency: (data.currency ?? 'XAF') as Currency,
        country: data.country ?? 'CM',
        language: (data.language ?? 'fr') as Language,
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
        // Automatically make the creator a PRESIDENT member with profile
        members: {
          create: {
            userId: data.creatorUserId,
            role: AssociationRole.PRESIDENT,
            memberNumber: matricule,
            profile: {
              create: {
                firstName: 'Fondateur',
              },
            },
          },
        },
      },
    });
    return this.toDomain(record);
  }

  async update(id: string, data: Partial<{
    name: string;
    logoUrl: string | null;
    motto: string | null;
    legalStatus: string | null;
    registrationRef: string | null;
    plan: any;
    currency: string;
    country: string;
    language: string;
    branding: any;
    savingsInterestRate: number;
    joiningFee: number;
    alertThresholds: any;
    settings: any;
  }>): Promise<AssociationAggregate> {
    const updateData: any = { ...data };
    
    if (data.branding !== undefined) {
      updateData.branding = data.branding ? JSON.stringify(data.branding) : null;
    }
    if (data.alertThresholds !== undefined) {
      updateData.alertThresholds = data.alertThresholds ? JSON.stringify(data.alertThresholds) : null;
    }
    if (data.settings !== undefined) {
      updateData.settings = data.settings ? JSON.stringify(data.settings) : null;
    }

    const record = await this.prisma.association.update({
      where: { id },
      data: updateData,
    });
    
    return this.toDomain(record);
  }
}
