import {
  addEvidence,
  completeQuest,
  openInEditor,
  revealHint,
  saveReflection,
  startCommandRun,
  startQuest,
  updateCheckpoint,
} from '@neon/challenge-engine/server';
import { assertLocalRequest, jsonError } from '@/lib/local-request';

export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    const body = (await request.json()) as Record<string, unknown>;
    const questId = String(body.questId ?? '');
    switch (body.action) {
      case 'start':
        return Response.json(await startQuest(questId));
      case 'checkpoint':
        return Response.json(
          await updateCheckpoint(
            questId,
            String(body.checkpointId),
            Boolean(body.completed),
          ),
        );
      case 'hint':
        return Response.json(await revealHint(questId));
      case 'evidence':
        return Response.json(
          await addEvidence(questId, {
            kind:
              body.kind === 'link' || body.kind === 'note'
                ? body.kind
                : 'manual',
            summary: String(body.summary ?? ''),
            detail: String(body.detail ?? ''),
          }),
        );
      case 'reflection':
        return Response.json(
          await saveReflection(questId, body.answers as Record<string, string>),
        );
      case 'complete':
        return Response.json(await completeQuest(questId));
      case 'run':
        return Response.json(
          await startCommandRun(questId, String(body.command ?? '')),
        );
      case 'open':
        await openInEditor(String(body.path ?? ''));
        return Response.json({ ok: true });
      default:
        throw new Error('Unknown action.');
    }
  } catch (error) {
    return jsonError(error);
  }
}
