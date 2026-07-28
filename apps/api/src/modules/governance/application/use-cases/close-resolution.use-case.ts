import { Inject, Injectable } from '@nestjs/common';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';

@Injectable()
export class CloseResolutionUseCase {
  constructor(
    @Inject('IGovernanceRepository')
    private readonly governanceRepo: IGovernanceRepository,
  ) {}

  async execute(resolutionId: string): Promise<any> {
    return this.governanceRepo.closeResolutionAtomic({ resolutionId });
  }
}
