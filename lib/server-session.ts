import { cookies, headers } from 'next/headers';
import { auth } from './auth';

const SESSION_COOKIE_NAMES = ['better-auth.session_token', '__Secure-better-auth.session_token'];

export function hasBetterAuthSessionCookie() {
  const cookieStore = cookies();
  return SESSION_COOKIE_NAMES.some((name) => Boolean(cookieStore.get(name)));
}

export type BetterAuthSession =
  | {
      session: Record<string, unknown>;
      user: {
        email?: string;
        [key: string]: unknown;
      };
    }
  | null;

export async function getBetterAuthSession(): Promise<BetterAuthSession> {
  try {
    const response = (await auth.api.getSession({
      headers: headers(),
      // `asResponse` is not part of the public types but is supported internally.
      asResponse: true,
    } as any)) as Response | BetterAuthSession | null;

    if (!response) {
      return null;
    }

    if (response instanceof Response) {
      if (!response.ok) {
        return null;
      }
      const data = await response.json().catch(() => null);
      return (data as BetterAuthSession) ?? null;
    }

    if (typeof response === 'object') {
      return response;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch BetterAuth session', error);
    return null;
  }
}
