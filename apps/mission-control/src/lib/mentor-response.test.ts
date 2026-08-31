import { describe, expect, it } from 'vitest';
import { parseMentorResponse } from './mentor-response';

describe('mentor response parsing', () => {
  it('accepts a complete structured coaching response', () => {
    expect(
      parseMentorResponse(
        JSON.stringify({
          diagnosis: 'The boundary is not validated yet.',
          question: 'Where does untrusted input first enter the system?',
          experiment: 'Send one invalid payload and inspect the response.',
          successSignal: 'The request is rejected before domain logic runs.',
          concept: 'Trust-boundary validation',
        }),
      ).concept,
    ).toBe('Trust-boundary validation');
  });

  it('rejects malformed or incomplete output', () => {
    expect(() => parseMentorResponse('not-json')).toThrow('unreadable');
    expect(() => parseMentorResponse('{"diagnosis":"Maybe"}')).toThrow(
      'incomplete',
    );
  });
});
