import { z } from 'zod';
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export function parseServerEnv(env: NodeJS.ProcessEnv): ServerEnv {
  return serverEnvSchema.parse(env);
}
