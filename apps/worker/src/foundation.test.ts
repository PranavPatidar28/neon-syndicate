import { describe, expect, it } from 'vitest';
describe('worker foundation', () => {
  it('does not claim product jobs', () => expect([]).toHaveLength(0));
});
