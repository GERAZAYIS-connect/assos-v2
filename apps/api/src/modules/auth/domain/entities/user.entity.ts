import { Language } from '@assos/shared';

export interface UserProps {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  platformRole: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  preferredLanguage: Language;
  createdAt: Date;
  deletedAt: Date | null;
}

/**
 * User Entity (Domain Layer)
 * Pure class with no NestJS or Prisma dependency.
 * Contains only identity, state, and business invariants.
 */
export class UserEntity {
  readonly id: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly passwordHash: string;
  readonly platformRole: string | null;
  readonly isEmailVerified: boolean;
  readonly isPhoneVerified: boolean;
  readonly twoFactorEnabled: boolean;
  readonly preferredLanguage: Language;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.phone = props.phone;
    this.passwordHash = props.passwordHash;
    this.platformRole = props.platformRole;
    this.isEmailVerified = props.isEmailVerified;
    this.isPhoneVerified = props.isPhoneVerified;
    this.twoFactorEnabled = props.twoFactorEnabled;
    this.preferredLanguage = props.preferredLanguage;
    this.createdAt = props.createdAt;
    this.deletedAt = props.deletedAt;
  }

  /** Domain invariant: a user must have at least one contact method */
  hasContactMethod(): boolean {
    return this.email !== null || this.phone !== null;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isPlatformAdmin(): boolean {
    return this.platformRole === 'SUPER_ADMIN' || this.platformRole === 'CO_ADMIN';
  }
}
