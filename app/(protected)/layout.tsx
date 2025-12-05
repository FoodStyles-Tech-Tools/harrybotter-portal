import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { auth } from '@/lib/auth';
import { isUserAllowed } from '@/lib/allowed-user';
import { getBetterAuthSession, hasBetterAuthSessionCookie } from '@/lib/server-session';

export const runtime = 'nodejs';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  if (!hasBetterAuthSessionCookie()) {
    redirect('/login');
  }

  const session = await getBetterAuthSession();
  if (!session) {
    redirect('/login');
  }

  const allowed = await isUserAllowed(session.user?.email);
  if (!allowed) {
    await auth.api.signOut({
      headers: headers(),
      asResponse: true,
    } as any);
    redirect('/login?error=not-registered');
  }

  const userImage =
    session && session.user && typeof (session.user as any).image === 'string'
      ? ((session.user as any).image as string)
      : null;

  const userName = typeof session.user?.name === 'string' ? (session.user.name as string) : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader userName={userName} userImage={userImage} />
      <main className="w-full px-8 py-8">{children}</main>
    </div>
  );
}
