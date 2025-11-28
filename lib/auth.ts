import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Pool } from 'pg';

const databaseUrl =
  process.env.BETTER_AUTH_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    'Missing database connection string. Set BETTER_AUTH_DATABASE_URL (or DATABASE_URL/SUPABASE_DB_URL/POSTGRES_URL).'
  );
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error('Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;

if (!betterAuthSecret) {
  throw new Error('Missing BETTER_AUTH_SECRET (or AUTH_SECRET).');
}

const resolvedBaseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  'http://localhost:3000';

const isLocalDb = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const globalForPool = globalThis as unknown as {
  betterAuthPool?: Pool;
};

const pool =
  globalForPool.betterAuthPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
    max: Number(process.env.BETTER_AUTH_DB_MAX_CONNECTIONS ?? 5),
    idleTimeoutMillis: Number(process.env.BETTER_AUTH_DB_IDLE_TIMEOUT ?? 30_000),
    connectionTimeoutMillis: Number(process.env.BETTER_AUTH_DB_CONNECTION_TIMEOUT ?? 10_000),
    keepAlive: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPool.betterAuthPool = pool;
}

export const auth = betterAuth({
  baseURL: resolvedBaseURL,
  secret: betterAuthSecret,
  database: pool,
  plugins: [nextCookies()],
  user: {
    modelName: 'auth_user',
  },
  onAPIError: {
    errorURL: `${resolvedBaseURL.replace(/\/$/, '')}/login`,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
});
