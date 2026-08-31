import { z } from 'zod';

export const mentorResponseSchema = z.object({
  diagnosis: z.string().min(1),
  question: z.string().min(1),
  experiment: z.string().min(1),
  successSignal: z.string().min(1),
  concept: z.string().min(1),
});

export type MentorResponse = z.infer<typeof mentorResponseSchema>;

export const mentorResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['diagnosis', 'question', 'experiment', 'successSignal', 'concept'],
  properties: {
    diagnosis: {
      type: 'string',
      description:
        'A concise evidence-based diagnosis, without a full solution.',
    },
    question: {
      type: 'string',
      description:
        'One question that makes the learner predict or explain behavior.',
    },
    experiment: {
      type: 'string',
      description:
        'One small, concrete diagnostic experiment for the learner to run.',
    },
    successSignal: {
      type: 'string',
      description:
        'The observable result that would confirm or reject the diagnosis.',
    },
    concept: {
      type: 'string',
      description: 'The primary engineering concept being practiced.',
    },
  },
} as const;

export function parseMentorResponse(text: string): MentorResponse {
  let value: unknown;
  try {
    const normalized = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    value = JSON.parse(normalized);
  } catch {
    throw new Error(
      'The mentor provider returned an unreadable response. Try again.',
    );
  }
  const parsed = mentorResponseSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      'The mentor provider returned an incomplete response. Try again.',
    );
  return parsed.data;
}
