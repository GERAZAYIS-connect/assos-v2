import { MemberNumber } from './member-number.vo';

describe('MemberNumber Value Object', () => {
  it('should generate matricule in format YY + 3_LETTERS_ASSOC + MMDD', () => {
    const testDate = new Date('2026-07-24T12:00:00Z');
    const matricule = MemberNumber.generate('ASF', testDate);

    expect(matricule).toBe('26ASF0724');
  });

  it('should handle multi-word association names', () => {
    const testDate = new Date('2026-07-24T12:00:00Z');
    const matricule = MemberNumber.generate('Association Solidarité Fraternelle', testDate);

    expect(matricule).toBe('26ASF0724');
  });

  it('should pad short names with ASS fallback', () => {
    const testDate = new Date('2026-07-24T12:00:00Z');
    const matricule = MemberNumber.generate('A', testDate);

    expect(matricule).toBe('26AAS0724');
  });
});
