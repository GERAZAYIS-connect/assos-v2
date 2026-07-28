export class MemberNumber {
  static generate(associationNameOrSlug: string, date: Date = new Date()): string {
    const yy = date.getFullYear().toString().slice(-2);

    const words = associationNameOrSlug
      .trim()
      .split(/\s+/)
      .map((w) =>
        w
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9]/g, '')
      )
      .filter(Boolean);

    let prefix = '';
    if (words.length >= 3) {
      prefix = words[0][0] + words[1][0] + words[2][0];
    } else if (words.length === 2) {
      prefix = words[0][0] + words[1].slice(0, 2);
    } else if (words.length === 1) {
      prefix = words[0].slice(0, 3);
    }

    prefix = (prefix + 'ASS').slice(0, 3);

    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yy}${prefix}${mm}${dd}`;
  }
}
