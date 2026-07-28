import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { Caisse } from '../../domain/entities/caisse.entity';

@Injectable()
export class GetCaissesUseCase {
  constructor(
    @Inject('ITreasuryRepository')
    private readonly treasuryRepository: ITreasuryRepository
  ) {}

  async execute(associationId: string): Promise<Caisse[]> {
    return this.treasuryRepository.findByAssociationId(associationId);
  }
}
