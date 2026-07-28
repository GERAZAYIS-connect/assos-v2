import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { Loan } from '../../domain/entities/loan.entity';

export interface RecordInformalReminderCommand {
  loanId: string;
  notes?: string;
  userId?: string; // Could be used to record who did the reminder
}

@Injectable()
export class RecordInformalReminderUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
  ) {}

  async execute(command: RecordInformalReminderCommand): Promise<Loan> {
    const loan = await this.loanRepo.findById(command.loanId);
    
    if (!loan) {
      throw new NotFoundException('Prêt introuvable', command.loanId);
    }

    loan.recordInformalReminder(command.notes);
    await this.loanRepo.updateLoan(loan);
    
    return loan;
  }
}
