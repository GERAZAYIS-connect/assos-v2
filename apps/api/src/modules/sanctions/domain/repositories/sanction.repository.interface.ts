import { Sanction } from '../entities/sanction.entity';
import { SanctionStatus } from '@prisma/client';

export interface ISanctionRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  createSanction(sanction: Sanction): Promise<void>;
  updateSanction(sanction: Sanction): Promise<void>;
  findById(id: string): Promise<Sanction | null>;
  listByAssociation(associationId: string, status?: SanctionStatus): Promise<Sanction[]>;
  listByMember(memberId: string): Promise<Sanction[]>;
  paySanctionAtomic(sanctionId: string, caisseId: string, paidByUserId?: string, associationId?: string): Promise<Sanction>;
  listAllByStatus(status: SanctionStatus): Promise<Sanction[]>;
}
