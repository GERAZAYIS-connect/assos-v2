export declare enum AssociationRole {
    PRESIDENT = "PRESIDENT",
    TREASURER = "TREASURER",
    SECRETARY = "SECRETARY",
    CENSOR = "CENSOR",
    MEMBER = "MEMBER"
}
export declare enum PlatformRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    CO_ADMIN = "CO_ADMIN"
}
export declare enum MemberStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    EXPELLED = "EXPELLED"
}
export declare enum SubscriptionPlan {
    DISCOVERY = "DISCOVERY",
    ESSENTIAL = "ESSENTIAL",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum CaisseType {
    MAIN = "MAIN",
    COLLECTIVE_SAVINGS = "COLLECTIVE_SAVINGS",
    INDIVIDUAL_SAVINGS = "INDIVIDUAL_SAVINGS",
    THEMATIC_SAVINGS = "THEMATIC_SAVINGS",
    SCHOOL_BANK = "SCHOOL_BANK",
    EMERGENCY = "EMERGENCY",
    TONTINE = "TONTINE"
}
export declare enum TontineType {
    FIXED_ORDER = "FIXED_ORDER",
    AUCTION = "AUCTION",
    RANDOM = "RANDOM",
    MULTI_SHARES = "MULTI_SHARES",
    SOCIAL = "SOCIAL"
}
export declare enum LoanStatus {
    PENDING = "PENDING",
    AWAITING_URGENT_DECISION = "AWAITING_URGENT_DECISION",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    DISBURSED = "DISBURSED",
    COMPLETED = "COMPLETED",
    DEFAULTED = "DEFAULTED"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED",
    TIMEOUT = "TIMEOUT",
    ANOMALY = "ANOMALY"
}
export declare enum NotificationChannel {
    PUSH = "PUSH",
    EMAIL = "EMAIL",
    SMS = "SMS"
}
export declare enum AuditCategory {
    AUTH = "AUTH",
    ASSOCIATION = "ASSOCIATION",
    MEMBER = "MEMBER",
    TREASURY = "TREASURY",
    LOAN = "LOAN",
    TONTINE = "TONTINE",
    SANCTION = "SANCTION",
    SUBSCRIPTION = "SUBSCRIPTION",
    PLATFORM = "PLATFORM"
}
export declare enum Currency {
    XAF = "XAF",
    XOF = "XOF",
    EUR = "EUR",
    USD = "USD",
    GBP = "GBP"
}
export declare enum Language {
    FR = "fr",
    EN = "en"
}
