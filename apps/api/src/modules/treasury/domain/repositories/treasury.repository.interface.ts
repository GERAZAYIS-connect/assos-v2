import { Caisse } from '../entities/caisse.entity';
import { Transaction } from '../entities/transaction.entity';

export interface ITreasuryRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;

  // Caisse methods
  createCaisse(caisse: Caisse): Promise<void>;
  updateCaisse(caisse: Caisse): Promise<void>;
  findById(id: string): Promise<Caisse | null>;
  findByAssociationId(associationId: string): Promise<Caisse[]>;

  // Transaction methods
  saveTransaction(transaction: Transaction): Promise<void>;
  findTransactionById(id: string): Promise<Transaction | null>;
  findTransactionsByCaisse(caisseId: string): Promise<Transaction[]>;

  // Complex Operations (ACID)
  getMemberBalanceInCaisse(memberId: string, caisseId: string): Promise<number>;

  executeTransaction(transaction: Transaction): Promise<void>;

  executeTransfer(
    sourceCaisse: Caisse,
    destinationCaisse: Caisse,
    transaction: Transaction
  ): Promise<void>;
}
