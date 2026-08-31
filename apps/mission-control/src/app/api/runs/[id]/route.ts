import { cancelCommandRun, getCommandRun } from '@neon/challenge-engine/server';
import { assertLocalRequest, jsonError } from '@/lib/local-request';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertLocalRequest(request);
    const run = getCommandRun((await context.params).id);
    return run
      ? Response.json(run)
      : Response.json({ error: 'Run not found.' }, { status: 404 });
  } catch (error) {
    return jsonError(error);
  }
}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertLocalRequest(request);
    const run = cancelCommandRun((await context.params).id);
    return run
      ? Response.json(run)
      : Response.json({ error: 'Run not found.' }, { status: 404 });
  } catch (error) {
    return jsonError(error);
  }
}
