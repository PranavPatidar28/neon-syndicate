import { loadEnvConfig } from '@next/env';
import { findRepositoryRoot } from '@neon/challenge-engine/server';

let loaded = false;

export async function loadRootEnvironment(): Promise<void> {
  if (loaded) return;
  loadEnvConfig(await findRepositoryRoot());
  loaded = true;
}
