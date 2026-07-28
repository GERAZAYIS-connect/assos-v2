import { Inject, Injectable } from '@nestjs/common';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

@Injectable()
export class GetResolutionDetailsUseCase {
  constructor(
    @Inject('IGovernanceRepository')
    private readonly governanceRepo: IGovernanceRepository,
  ) {}

  async execute(resolutionId: string): Promise<any> {
    const res = await this.governanceRepo.findById(resolutionId);
    if (!res) {
      throw new NotFoundException('Résolution', resolutionId);
    }
    return res;
  }
}
