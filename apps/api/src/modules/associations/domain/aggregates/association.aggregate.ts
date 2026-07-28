import { Currency, Language, SubscriptionPlan } from '@assos/shared';

export interface AssociationProps {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  currency: Currency;
  country: string;
  language: Language;
  branding: AssociationBranding | null;
  motto: string | null;
  savingsInterestRate: number;
  joiningFee: number;
  alertThresholds: any | null;
  plan: SubscriptionPlan;
  isActive: boolean;
  createdAt: Date;
}

export interface AssociationBranding {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

/**
 * Association Aggregate Root (Domain Layer)
 * This is the tenant boundary: all multi-tenant data has an associationId FK.
 */
export class AssociationAggregate {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl: string | null;
  readonly currency: Currency;
  readonly country: string;
  readonly language: Language;
  readonly branding: AssociationBranding | null;
  readonly motto: string | null;
  readonly savingsInterestRate: number;
  readonly joiningFee: number;
  readonly alertThresholds: any | null;
  readonly plan: SubscriptionPlan;
  readonly isActive: boolean;
  readonly createdAt: Date;

  constructor(props: AssociationProps) {
    Object.assign(this, props);
  }

  /** Domain rule: branding colors must be valid hex codes if provided */
  hasBranding(): boolean {
    return this.branding !== null;
  }

  getBrandingCssVars(): Record<string, string> {
    if (!this.branding) return {};
    const vars: Record<string, string> = {};
    if (this.branding.primaryColor) vars['--color-primary'] = this.branding.primaryColor;
    if (this.branding.secondaryColor) vars['--color-secondary'] = this.branding.secondaryColor;
    if (this.branding.accentColor) vars['--color-accent'] = this.branding.accentColor;
    return vars;
  }
}
