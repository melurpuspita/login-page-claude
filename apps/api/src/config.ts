export interface Config {
  port: number;
  jwtSecret: string;
  corsOrigin: string;
  secureCookies: boolean;
  seedEmail: string;
  seedPassword: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET wajib diisi");
  const seedEmail = env.SEED_USER_EMAIL;
  const seedPassword = env.SEED_USER_PASSWORD;
  if (!seedEmail || !seedPassword) {
    throw new Error("SEED_USER_EMAIL dan SEED_USER_PASSWORD wajib diisi");
  }
  return {
    port: Number(env.API_PORT ?? 3001),
    jwtSecret,
    corsOrigin: env.CORS_ORIGIN ?? "http://localhost:5173",
    secureCookies: env.NODE_ENV === "production",
    seedEmail,
    seedPassword,
  };
}
