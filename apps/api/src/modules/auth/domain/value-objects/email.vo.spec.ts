import { Email } from './email.vo';

describe('Email Value Object', () => {
  it('should create a valid email and normalize it (lowercase & trimmed)', () => {
    const email = Email.create('  Marie.Tchinda@Example.COM  ');
    expect(email.value).toBe('marie.tchinda@example.com');
  });

  it('should throw an error for an invalid email format', () => {
    expect(() => Email.create('invalid-email')).toThrow();
    expect(() => Email.create('user@com')).toThrow();
    expect(() => Email.create('')).toThrow();
  });

  it('should correctly compare two Email VOs for equality', () => {
    const e1 = Email.create('user@test.com');
    const e2 = Email.create('USER@test.com');
    const e3 = Email.create('other@test.com');

    expect(e1.equals(e2)).toBe(true);
    expect(e1.equals(e3)).toBe(false);
  });
});
