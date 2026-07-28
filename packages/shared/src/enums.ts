// Roles
export enum AssociationRole {
  PRESIDENT = 'PRESIDENT',
  TREASURER = 'TREASURER',
  SECRETARY = 'SECRETARY',
  CENSOR = 'CENSOR',
  MEMBER = 'MEMBER',
}

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CO_ADMIN = 'CO_ADMIN',
}

// Member status
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPELLED = 'EXPELLED',
}

// Subscription plans
export enum SubscriptionPlan {
  DISCOVERY = 'DISCOVERY',
  ESSENTIAL = 'ESSENTIAL',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

// Treasury / Caisse types
export enum CaisseType {
  MAIN = 'MAIN',
  COLLECTIVE_SAVINGS = 'COLLECTIVE_SAVINGS',
  INDIVIDUAL_SAVINGS = 'INDIVIDUAL_SAVINGS',
  THEMATIC_SAVINGS = 'THEMATIC_SAVINGS',
  SCHOOL_BANK = 'SCHOOL_BANK',
  EMERGENCY = 'EMERGENCY',
  TONTINE = 'TONTINE',
}

// Tontine types
export enum TontineType {
  FIXED_ORDER = 'FIXED_ORDER',
  AUCTION = 'AUCTION',
  RANDOM = 'RANDOM',
  MULTI_SHARES = 'MULTI_SHARES',
  SOCIAL = 'SOCIAL',
}

// Loan status
export enum LoanStatus {
  PENDING = 'PENDING',
  AWAITING_URGENT_DECISION = 'AWAITING_URGENT_DECISION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  ANOMALY = 'ANOMALY',
}

// Notification channels
export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// Audit action categories
export enum AuditCategory {
  AUTH = 'AUTH',
  ASSOCIATION = 'ASSOCIATION',
  MEMBER = 'MEMBER',
  TREASURY = 'TREASURY',
  LOAN = 'LOAN',
  TONTINE = 'TONTINE',
  SANCTION = 'SANCTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PLATFORM = 'PLATFORM',
}

// Supported currencies
export enum Currency {
  XAF = 'XAF', // Franc CFA BEAC (Cameroun, Gabon...)
  XOF = 'XOF', // Franc CFA BCEAO (Sénégal, Côte d'Ivoire...)
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}

// Supported languages
export enum Language {
  FR = 'fr',
  EN = 'en',
}
