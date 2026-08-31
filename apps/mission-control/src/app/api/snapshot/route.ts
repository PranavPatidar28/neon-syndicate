import { getCampaignSnapshot } from '@neon/challenge-engine/server';
import { assertLocalRequest, jsonError } from '@/lib/local-request';
import { loadRootEnvironment } from '@/lib/root-env';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    assertLocalRequest(request);
    await loadRootEnvironment();
    return Response.json(await getCampaignSnapshot());
  } catch (error) {
    return jsonError(error);
  }
}
