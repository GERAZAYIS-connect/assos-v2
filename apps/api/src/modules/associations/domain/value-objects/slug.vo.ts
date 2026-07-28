/**
 * Slug Value Object
 * Represents the unique URL identifier of an association.
 * Rules: 3-30 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens.
 */
export class Slug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): Slug {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!Slug.isValid(normalized)) {
      throw new Error(
        `Invalid slug "${raw}". Must be 3-30 characters, lowercase alphanumeric and hyphens only, no leading/trailing hyphens.`,
      );
    }
    return new Slug(normalized);
  }

  static isValid(slug: string): boolean {
    return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
