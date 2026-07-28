import { Tontine } from '../entities/tontine.entity';

export interface ITontineRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  createTontine(tontine: Tontine, memberIds: string[]): Promise<Tontine>;
  findById(id: string): Promise<Tontine | null>;
  findByAssociationId(associationId: string, memberId?: string): Promise<Tontine[]>;
  updateTontine(tontine: Tontine): Promise<void>;

  // ACID atomic operations
  payContributionAtomic(data: {
    roundId: string;
    memberId: string;
    amount: number;
    createdByUserId?: string;
  }): Promise<{ contribution: any; transaction: any }>;

  attributePotAtomic(data: {
    roundId: string;
    beneficiaryMemberId: string;
    potAmount: number;
    auctionAmount?: number;
    createdByUserId?: string;
  }): Promise<{ round: any; transaction: any }>;

  renewTontineAtomic(tontineId: string): Promise<any>;
}
