import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { CreateCaisseUseCase } from '../../application/use-cases/create-caisse.use-case';
import { GetCaissesUseCase } from '../../application/use-cases/get-caisses.use-case';
import { RecordTransactionUseCase } from '../../application/use-cases/record-transaction.use-case';
import { TransferFundsUseCase } from '../../application/use-cases/transfer-funds.use-case';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/use-cases/list-transactions.use-case';
import { CaisseType, TransactionType } from '@prisma/client';

class CreateCaisseDto {
  @IsEnum(CaisseType)
  type: CaisseType;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isLoanable?: boolean;

  @IsBoolean()
  @IsOptional()
  isBankAccount?: boolean;

  @IsString()
  @IsOptional()
  accountDetails?: string;
}

class RecordTransactionDto {
  @IsUUID()
  caisseId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  memberId?: string;
}

class TransferFundsDto {
  @IsUUID()
  sourceCaisseId: string;

  @IsUUID()
  destinationCaisseId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

@Controller('associations/:associationId/treasury')
@UseGuards(AuthGuard('jwt'))
export class TreasuryController {
  constructor(
    private readonly createCaisseUseCase: CreateCaisseUseCase,
    private readonly getCaissesUseCase: GetCaissesUseCase,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
    private readonly transferFundsUseCase: TransferFundsUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
  ) {}

  @Get('caisses')
  async getCaisses(@Param('associationId') associationId: string) {
    const caisses = await this.getCaissesUseCase.execute(associationId);
    return caisses.map(c => c.toJSON());
  }

  @Get('transactions')
  async listTransactions(
    @Param('associationId') associationId: string,
    @Query('caisseId') caisseId?: string,
    @Query('type') type?: TransactionType,
  ) {
    return this.listTransactionsUseCase.execute({ associationId, caisseId, type });
  }

  @Post('caisses')
  async createCaisse(
    @Param('associationId') associationId: string,
    @Body() dto: CreateCaisseDto,
  ) {
    const caisse = await this.createCaisseUseCase.execute({
      ...dto,
      associationId,
    });
    return caisse.toJSON();
  }

  @Post('transactions')
  async recordTransaction(
    @Param('associationId') associationId: string,
    @Body() dto: RecordTransactionDto,
    @Request() req: any
  ) {
    const userId = req.user?.id; // Assumes req.user is set by auth guard
    const transaction = await this.recordTransactionUseCase.execute({
      ...dto,
      associationId,
      createdByUserId: userId,
    });
    return transaction.toJSON();
  }

  @Post('transfers')
  async transferFunds(
    @Param('associationId') associationId: string,
    @Body() dto: TransferFundsDto,
    @Request() req: any
  ) {
    const userId = req.user?.id;
    const transaction = await this.transferFundsUseCase.execute({
      ...dto,
      associationId,
      createdByUserId: userId,
    });
    return transaction.toJSON();
  }

  @Get('transactions/:transactionId')
  async getTransaction(
    @Param('associationId') associationId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.getTransactionUseCase.execute({ associationId, transactionId });
  }
}
