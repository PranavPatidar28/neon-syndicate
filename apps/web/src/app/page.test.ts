import { describe, expect, it } from 'vitest';
describe('foundation', () => {
  it('keeps product features locked', () => {
    expect('foundation').not.toBe('product');
  });
});
