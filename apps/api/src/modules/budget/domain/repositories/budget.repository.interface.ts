import { BudgetStatus, BudgetItemType, DistributionStatus, DividendStatus } from '@prisma/client';

export const BUDGET_REPOSITORY = 'BUDGET_REPOSITORY';

export interface CreateAnnualBudgetInput {
  associationId: string;
  year: number;
  title: string;
  items?: {
    caisseId?: string;
    type: BudgetItemType;
    category: string;
    estimatedAmount: number;
    description?: string;
  }[];
}

export interface CreateProfitDistributionInput {
  associationId: string;
  year: number;
  annualBudgetId?: string;
  baseUnitAmount?: number;
  partyExpenses?: number;
  retainedReserve?: number;
}

export interface IBudgetRepository {
  createAnnualBudget(input: CreateAnnualBudgetInput): Promise<any>;
  findAnnualBudgetByYear(associationId: string, year: number): Promise<any | null>;
  listAnnualBudgets(associationId: string): Promise<any[]>;
  updateAnnualBudgetStatus(id: string, status: BudgetStatus): Promise<any>;

  getBudgetExecutionStats(associationId: string, year: number): Promise<{
    year: number;
    totalEstimatedIncome: number;
    totalEstimatedExpense: number;
    totalRealIncome: number;
    totalRealExpense: number;
    executionIncomePercentage: number;
    executionExpensePercentage: number;
    netRealProfit: number;
    totalGlobalSavings: number;
    totalLoanInterestProfit: number;
    items: any[];
  }>;

  calculateProfitDistribution(input: CreateProfitDistributionInput): Promise<any>;
  executeProfitDistribution(input: CreateProfitDistributionInput, adminUserId: string): Promise<any>;
  getProfitDistribution(associationId: string, year: number): Promise<any | null>;
  listProfitDistributions(associationId: string): Promise<any[]>;
}
