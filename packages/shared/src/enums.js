"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Language = exports.Currency = exports.AuditCategory = exports.NotificationChannel = exports.TransactionStatus = exports.LoanStatus = exports.TontineType = exports.CaisseType = exports.SubscriptionPlan = exports.MemberStatus = exports.PlatformRole = exports.AssociationRole = void 0;
var AssociationRole;
(function (AssociationRole) {
    AssociationRole["PRESIDENT"] = "PRESIDENT";
    AssociationRole["TREASURER"] = "TREASURER";
    AssociationRole["SECRETARY"] = "SECRETARY";
    AssociationRole["CENSOR"] = "CENSOR";
    AssociationRole["MEMBER"] = "MEMBER";
})(AssociationRole || (exports.AssociationRole = AssociationRole = {}));
var PlatformRole;
(function (PlatformRole) {
    PlatformRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    PlatformRole["CO_ADMIN"] = "CO_ADMIN";
})(PlatformRole || (exports.PlatformRole = PlatformRole = {}));
var MemberStatus;
(function (MemberStatus) {
    MemberStatus["ACTIVE"] = "ACTIVE";
    MemberStatus["SUSPENDED"] = "SUSPENDED";
    MemberStatus["EXPELLED"] = "EXPELLED";
})(MemberStatus || (exports.MemberStatus = MemberStatus = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["DISCOVERY"] = "DISCOVERY";
    SubscriptionPlan["ESSENTIAL"] = "ESSENTIAL";
    SubscriptionPlan["PRO"] = "PRO";
    SubscriptionPlan["ENTERPRISE"] = "ENTERPRISE";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var CaisseType;
(function (CaisseType) {
    CaisseType["MAIN"] = "MAIN";
    CaisseType["COLLECTIVE_SAVINGS"] = "COLLECTIVE_SAVINGS";
    CaisseType["INDIVIDUAL_SAVINGS"] = "INDIVIDUAL_SAVINGS";
    CaisseType["THEMATIC_SAVINGS"] = "THEMATIC_SAVINGS";
    CaisseType["SCHOOL_BANK"] = "SCHOOL_BANK";
    CaisseType["EMERGENCY"] = "EMERGENCY";
    CaisseType["TONTINE"] = "TONTINE";
})(CaisseType || (exports.CaisseType = CaisseType = {}));
var TontineType;
(function (TontineType) {
    TontineType["FIXED_ORDER"] = "FIXED_ORDER";
    TontineType["AUCTION"] = "AUCTION";
    TontineType["RANDOM"] = "RANDOM";
    TontineType["MULTI_SHARES"] = "MULTI_SHARES";
    TontineType["SOCIAL"] = "SOCIAL";
})(TontineType || (exports.TontineType = TontineType = {}));
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["PENDING"] = "PENDING";
    LoanStatus["AWAITING_URGENT_DECISION"] = "AWAITING_URGENT_DECISION";
    LoanStatus["APPROVED"] = "APPROVED";
    LoanStatus["REJECTED"] = "REJECTED";
    LoanStatus["DISBURSED"] = "DISBURSED";
    LoanStatus["COMPLETED"] = "COMPLETED";
    LoanStatus["DEFAULTED"] = "DEFAULTED";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["CONFIRMED"] = "CONFIRMED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["TIMEOUT"] = "TIMEOUT";
    TransactionStatus["ANOMALY"] = "ANOMALY";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var AuditCategory;
(function (AuditCategory) {
    AuditCategory["AUTH"] = "AUTH";
    AuditCategory["ASSOCIATION"] = "ASSOCIATION";
    AuditCategory["MEMBER"] = "MEMBER";
    AuditCategory["TREASURY"] = "TREASURY";
    AuditCategory["LOAN"] = "LOAN";
    AuditCategory["TONTINE"] = "TONTINE";
    AuditCategory["SANCTION"] = "SANCTION";
    AuditCategory["SUBSCRIPTION"] = "SUBSCRIPTION";
    AuditCategory["PLATFORM"] = "PLATFORM";
})(AuditCategory || (exports.AuditCategory = AuditCategory = {}));
var Currency;
(function (Currency) {
    Currency["XAF"] = "XAF";
    Currency["XOF"] = "XOF";
    Currency["EUR"] = "EUR";
    Currency["USD"] = "USD";
    Currency["GBP"] = "GBP";
})(Currency || (exports.Currency = Currency = {}));
var Language;
(function (Language) {
    Language["FR"] = "fr";
    Language["EN"] = "en";
})(Language || (exports.Language = Language = {}));
//# sourceMappingURL=enums.js.map