import { Inject, Injectable } from '@nestjs/common';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';

@Injectable()
export class ListResolutionsUseCase {
  constructor(
    @Inject('IGovernanceRepository')
    private readonly governanceRepo: IGovernanceRepository,
  ) {}

  async execute(associationId: string): Promise<any[]> {
    return this.governanceRepo.findByAssociationId(associationId);
  }
}
