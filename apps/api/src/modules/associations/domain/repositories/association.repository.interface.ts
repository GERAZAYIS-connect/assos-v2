import { AssociationAggregate } from '../aggregates/association.aggregate';

export interface IAssociationRepository {
  findById(id: string): Promise<AssociationAggregate | null>;
  findBySlug(slug: string): Promise<AssociationAggregate | null>;
  findByMemberId(userId: string): Promise<AssociationAggregate[]>;
  findByMemberIdWithRole(userId: string): Promise<{ association: AssociationAggregate; role: string; memberId: string }[]>;
  slugExists(slug: string): Promise<boolean>;
  findPublic(limit?: number): Promise<{ id: string; name: string; slug: string; logoUrl: string | null; country: string; memberCount: number }[]>;
  create(data: {
    name: string;
    slug: string;
    currency?: string;
    country?: string;
    language?: string;
    creatorUserId: string;
  }): Promise<AssociationAggregate>;
  update(id: string, data: Partial<{
    name: string;
    logoUrl: string | null;
    motto: string | null;
    currency: string;
    country: string;
    language: string;
    branding: any;
    savingsInterestRate: number;
    joiningFee: number;
    alertThresholds: any;
    settings: any;
  }>): Promise<AssociationAggregate>;
}

export const ASSOCIATION_REPOSITORY = Symbol('IAssociationRepository');
