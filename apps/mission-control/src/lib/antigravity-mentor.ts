import { mentorResponseJsonSchema } from './mentor-response';

const DEFAULT_BASE_URL = 'http://localhost:8080';
const DEFAULT_MODEL = 'gemini-3.6-flash-high';
const DEFAULT_TIMEOUT_MS = 60_000;

type Fetch = typeof fetch;

type AntigravityMessageResponse = {
  id?: unknown;
  content?: unknown;
};

export type AntigravityMentorResult = {
  id: string | null;
  model: string;
  text: string;
};

export function getAntigravityConfig() {
  return {
    baseUrl: (process.env.ANTIGRAVITY_BASE_URL ?? DEFAULT_BASE_URL).replace(
      /\/+$/,
      '',
    ),
    model: process.env.ANTIGRAVITY_MENTOR_MODEL ?? DEFAULT_MODEL,
  };
}

export function extractAntigravityText(response: unknown): string {
  const content = (response as AntigravityMessageResponse | null)?.content;
  if (!Array.isArray(content))
    throw new Error('Antigravity proxy returned an unreadable response.');

  const text = content
    .filter(
      (block): block is { type: 'text'; text: string } =>
        typeof block === 'object' &&
        block !== null &&
        (block as { type?: unknown }).type === 'text' &&
        typeof (block as { text?: unknown }).text === 'string',
    )
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('Antigravity proxy returned no mentor response.');
  return text;
}

export async function askAntigravityMentor(
  context: string,
  fetchImplementation: Fetch = fetch,
): Promise<AntigravityMentorResult> {
  const { baseUrl, model } = getAntigravityConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImplementation(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1_200,
        temperature: 0.2,
        system: [
          'You are the hints-first mentor for a software learning campaign.',
          'Never provide the complete quest solution or implementation.',
          'Respect the revealed hint level. Diagnose only from supplied evidence, ask the learner to predict behavior, and propose exactly one small experiment.',
          'Return only a JSON object that matches this schema, with no Markdown fences or commentary:',
          JSON.stringify(mentorResponseJsonSchema),
        ].join(' '),
        messages: [{ role: 'user', content: context }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500).trim();
      throw new Error(
        `Antigravity proxy request failed (${response.status})${detail ? `: ${detail}` : '.'}`,
      );
    }

    const payload = (await response.json()) as AntigravityMessageResponse;
    return {
      id: typeof payload.id === 'string' ? payload.id : null,
      model,
      text: extractAntigravityText(payload),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      throw new Error(
        'Antigravity proxy timed out. Confirm the local proxy is running and try again.',
      );
    if (error instanceof TypeError)
      throw new Error(
        `Could not reach the Antigravity proxy at ${baseUrl}. Start it and try again.`,
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
