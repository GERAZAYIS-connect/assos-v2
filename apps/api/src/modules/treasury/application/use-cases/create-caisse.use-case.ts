import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { Caisse } from '../../domain/entities/caisse.entity';
import { CaisseType } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface CreateCaisseCommand {
  associationId: string;
  type: CaisseType;
  name: string;
  isLoanable?: boolean;
  isBankAccount?: boolean;
  accountDetails?: string;
}

@Injectable()
export class CreateCaisseUseCase {
  constructor(
    @Inject('ITreasuryRepository')
    private readonly treasuryRepository: ITreasuryRepository
  ) {}

  async execute(command: CreateCaisseCommand): Promise<Caisse> {
    const caisse = Caisse.create({
      id: randomUUID(),
      associationId: command.associationId,
      type: command.type,
      name: command.name,
      balance: 0,
      isLoanable: command.isLoanable || false,
      isBankAccount: command.isBankAccount || false,
      accountDetails: command.accountDetails,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.treasuryRepository.createCaisse(caisse);
    return caisse;
  }
}
