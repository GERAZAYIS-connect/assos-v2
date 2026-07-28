import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

@Injectable()
export class RenewTontineUseCase {
  constructor(
    @Inject('ITontineRepository')
    private readonly tontineRepo: ITontineRepository,
  ) {}

  async execute(tontineId: string): Promise<any> {
    const tontine = await this.tontineRepo.findById(tontineId);
    if (!tontine) {
      throw new NotFoundException('Tontine', tontineId);
    }

    return this.tontineRepo.renewTontineAtomic(tontineId);
  }
}
