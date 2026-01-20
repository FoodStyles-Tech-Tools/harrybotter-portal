import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isUserAllowed } from '@/lib/allowed-user';
import { getBetterAuthSession, hasBetterAuthSessionCookie } from '@/lib/server-session';
import LoginView from './LoginView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  'not-registered': 'You are not registered. Please contact your TechTool Lead.',
  unable_to_create_user: 'You are not registered. Please contact your TechTool Lead.',
};

interface LoginPageProps {
  searchParams?: {
    error?: string;
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let session = null;
  let errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? null : null;

  if (hasBetterAuthSessionCookie()) {
    session = await getBetterAuthSession();
  }

  if (session) {
    const allowed = await isUserAllowed(session.user?.email);
    if (allowed) {
      redirect('/chat');
    } else {
      await auth.api.signOut({
        headers: headers(),
        asResponse: true,
      } as any);
      errorMessage ??= ERROR_MESSAGES['not-registered'];
    }
  }

  return <LoginView initialError={errorMessage ?? undefined} />;
}
