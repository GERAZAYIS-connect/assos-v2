import { Resolution } from '../entities/resolution.entity';
import { VoteChoice } from '@prisma/client';

export interface IGovernanceRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  createResolution(resolution: Resolution): Promise<Resolution>;
  findById(id: string): Promise<any | null>;
  findByAssociationId(associationId: string): Promise<any[]>;

  castVote(data: {
    resolutionId: string;
    voterMemberId: string;
    choice: VoteChoice;
  }): Promise<any>;

  closeResolutionAtomic(data: {
    resolutionId: string;
  }): Promise<any>;
}
