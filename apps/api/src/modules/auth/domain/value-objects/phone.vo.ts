/**
 * Phone Value Object
 * Stores international phone numbers in E.164 format.
 * Cameroon default: +237XXXXXXXXX
 */
export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): Phone {
    const cleaned = raw.replace(/\s+/g, '').trim();
    if (!Phone.isValid(cleaned)) {
      throw new Error(`Invalid phone number: "${raw}". Must be in E.164 format (+237XXXXXXXXX)`);
    }
    return new Phone(cleaned);
  }

  static isValid(phone: string): boolean {
    // E.164 format: + followed by 7–15 digits
    return /^\+[1-9]\d{6,14}$/.test(phone);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
