import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../../treasury/domain/repositories/treasury.repository.interface';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

export interface GetMemberSavingsBalanceCommand {
  associationId: string;
  memberId: string;
  caisseId?: string; // If provided, returns balance for one caisse. If omitted, returns for all caisses.
}

@Injectable()
export class GetMemberSavingsBalanceUseCase {
  constructor(
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
  ) {}

  async execute(command: GetMemberSavingsBalanceCommand) {
    const assocId = await this.treasuryRepo.resolveAssociationId(command.associationId);

    if (command.caisseId) {
      const caisse = await this.treasuryRepo.findById(command.caisseId);
      if (!caisse || caisse.associationId !== assocId) {
        throw new NotFoundException('Caisse', command.caisseId);
      }

      const balance = await this.treasuryRepo.getMemberBalanceInCaisse(command.memberId, command.caisseId);
      return {
        caisseId: command.caisseId,
        caisseName: caisse.name,
        balance,
      };
    } else {
      // Get all caisses for the association
      const caisses = await this.treasuryRepo.findByAssociationId(command.associationId);
      const balances = [];

      for (const caisse of caisses) {
        const balance = await this.treasuryRepo.getMemberBalanceInCaisse(command.memberId, caisse.id);
        if (balance > 0) { // Or we can return all even if 0, but only for Savings/Emergency types
          balances.push({
            caisseId: caisse.id,
            caisseName: caisse.name,
            caisseType: caisse.type,
            balance,
          });
        }
      }

      return {
        memberId: command.memberId,
        totalBalance: balances.reduce((sum, b) => sum + b.balance, 0),
        caisses: balances,
      };
    }
  }
}
