import { createHash } from 'node:crypto';
import { buildMentorContext } from '@neon/challenge-engine/server';
import { askAntigravityMentor } from '@/lib/antigravity-mentor';
import { assertLocalRequest, jsonError } from '@/lib/local-request';
import { parseMentorResponse } from '@/lib/mentor-response';
import { loadRootEnvironment } from '@/lib/root-env';

export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    await loadRootEnvironment();
    const body = (await request.json()) as {
      questId?: string;
      question?: string;
      files?: string[];
      approvedHash?: string;
    };
    const context = await buildMentorContext(
      String(body.questId ?? ''),
      String(body.question ?? ''),
      body.files ?? [],
    );
    const serialized = JSON.stringify(context.payload);
    const hash = createHash('sha256').update(serialized).digest('hex');
    if (hash !== body.approvedHash)
      throw new Error(
        'Context changed after preview. Review it again before sending.',
      );
    const response = await askAntigravityMentor(serialized);
    return Response.json({
      answer: parseMentorResponse(response.text),
      responseId: response.id,
      model: response.model,
    });
  } catch (error) {
    return jsonError(error);
  }
}
