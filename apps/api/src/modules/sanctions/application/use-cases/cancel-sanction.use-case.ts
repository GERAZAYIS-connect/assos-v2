import { Inject, Injectable } from '@nestjs/common';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { Sanction } from '../../domain/entities/sanction.entity';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

export interface CancelSanctionCommand {
  sanctionId: string;
  actionType: 'CANCEL' | 'EXCUSE';
}

@Injectable()
export class CancelSanctionUseCase {
  constructor(
    @Inject('ISanctionRepository') private readonly sanctionRepo: ISanctionRepository,
  ) {}

  async execute(command: CancelSanctionCommand): Promise<Sanction> {
    const sanction = await this.sanctionRepo.findById(command.sanctionId);
    if (!sanction) {
      throw new NotFoundException('Sanction', command.sanctionId);
    }

    if (command.actionType === 'EXCUSE') {
      sanction.excuse();
    } else {
      sanction.cancel();
    }

    await this.sanctionRepo.updateSanction(sanction);
    return sanction;
  }
}
