import { createHash } from 'node:crypto';
import { buildMentorContext } from '@neon/challenge-engine/server';
import { assertLocalRequest, jsonError } from '@/lib/local-request';

export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    const body = (await request.json()) as {
      questId?: string;
      question?: string;
      files?: string[];
    };
    const context = await buildMentorContext(
      String(body.questId ?? ''),
      String(body.question ?? ''),
      body.files ?? [],
    );
    const serialized = JSON.stringify(context.payload);
    return Response.json({
      ...context,
      hash: createHash('sha256').update(serialized).digest('hex'),
      payload: context.payload,
    });
  } catch (error) {
    return jsonError(error);
  }
}
