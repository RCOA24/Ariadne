/**
 * Environment variable names only. Runtime validation is introduced with the
 * first infrastructure implementation prompt.
 */
export const environmentKeys = {
  databaseUrl: "DATABASE_URL",
  redisUrl: "REDIS_URL",
  authSecret: "AUTH_SECRET",
  authUrl: "AUTH_URL"
} as const;
