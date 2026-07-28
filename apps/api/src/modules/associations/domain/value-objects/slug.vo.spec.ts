import { Slug } from './slug.vo';

describe('Slug Value Object', () => {
  it('should format and validate valid slugs', () => {
    const slug = Slug.create(' Mutuelle Les Collines ');
    expect(slug.value).toBe('mutuelle-les-collines');
  });

  it('should reject slugs that are too short, too long, or contain invalid chars', () => {
    expect(() => Slug.create('ab')).toThrow(); // < 3 chars
    expect(() => Slug.create('this-slug-name-is-far-too-long-for-an-association')).toThrow(); // > 30 chars
    expect(() => Slug.create('asso_123!')).toThrow();
  });
});
