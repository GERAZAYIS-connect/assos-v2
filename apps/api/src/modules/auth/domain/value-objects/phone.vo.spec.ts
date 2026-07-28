import { Phone } from './phone.vo';

describe('Phone Value Object', () => {
  it('should create a valid E.164 phone number', () => {
    const phone = Phone.create('+237 690 12 34 56');
    expect(phone.value).toBe('+237690123456');
  });

  it('should throw an error for non-E.164 formats', () => {
    expect(() => Phone.create('0690123456')).toThrow();
    expect(() => Phone.create('abc')).toThrow();
  });
});
