import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askAntigravityMentor,
  extractAntigravityText,
} from './antigravity-mentor';

afterEach(() => {
  delete process.env.ANTIGRAVITY_BASE_URL;
  delete process.env.ANTIGRAVITY_MENTOR_MODEL;
});

describe('Antigravity mentor adapter', () => {
  it('extracts and joins Anthropic text blocks', () => {
    expect(
      extractAntigravityText({
        content: [
          { type: 'thinking', thinking: 'hidden' },
          { type: 'text', text: '{"diagnosis":"first"}' },
        ],
      }),
    ).toBe('{"diagnosis":"first"}');
  });

  it('rejects malformed or empty proxy responses', () => {
    expect(() => extractAntigravityText({ content: 'invalid' })).toThrow(
      'unreadable',
    );
    expect(() => extractAntigravityText({ content: [] })).toThrow(
      'no mentor response',
    );
  });

  it('sends an Anthropic-compatible request without an SDK', async () => {
    process.env.ANTIGRAVITY_BASE_URL = 'http://proxy.test/';
    process.env.ANTIGRAVITY_MENTOR_MODEL = 'test-model';
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'msg_123',
          content: [{ type: 'text', text: '{"diagnosis":"ok"}' }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await expect(askAntigravityMentor('{}', fetchMock)).resolves.toEqual({
      id: 'msg_123',
      model: 'test-model',
      text: '{"diagnosis":"ok"}',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://proxy.test/v1/messages',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      model: 'test-model',
      messages: [{ role: 'user', content: '{}' }],
    });
  });

  it('surfaces bounded non-success responses', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('proxy unavailable', { status: 503 }));

    await expect(askAntigravityMentor('{}', fetchMock)).rejects.toThrow('503');
  });
});
