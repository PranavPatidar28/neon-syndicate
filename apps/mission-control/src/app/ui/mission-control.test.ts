import { describe, expect, it } from 'vitest';
describe('Mission Control foundation', () => {
  it('keeps the manager separate from the learner game', () =>
    expect('@neon/mission-control').not.toBe('@neon/web'));
});
