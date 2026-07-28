/**
 * Email Value Object
 * Ensures emails are always valid and normalized (lowercase, trimmed).
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new Error(`Invalid email address: "${raw}"`);
    }
    return new Email(normalized);
  }

  static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
