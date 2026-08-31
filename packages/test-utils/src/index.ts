export const deterministicNow = new Date('2099-01-01T00:00:00.000Z');
export function uniqueTestId(prefix = 'test'): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
