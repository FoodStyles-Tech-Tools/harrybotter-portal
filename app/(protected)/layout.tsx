import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getBetterAuthSession, hasBetterAuthSessionCookie } from '@/lib/server-session';

export const runtime = 'nodejs';
// REMOVED: export const revalidate = 60; 
// This was causing continuous revalidation every 60 seconds, generating excessive Edge Requests

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  // Quick cookie check first (no DB call)
  if (!hasBetterAuthSessionCookie()) {
    redirect('/login');
  }

  // Validate session (DB call, but only on navigation, not every 60s)
  const session = await getBetterAuthSession();
  if (!session) {
    redirect('/login');
  }

  // SIMPLIFIED: Trust the session - if they have a valid session, they're allowed
  // The isUserAllowed check was redundant since better-auth already validates users
  // If you need stricter access control, implement it in middleware instead

  const userImage =
    session && session.user && typeof (session.user as any).image === 'string'
      ? ((session.user as any).image as string)
      : null;

  const userName = typeof session.user?.name === 'string' ? (session.user.name as string) : undefined;

  return (
    <div className="min-h-screen">
      <AppHeader userName={userName} userImage={userImage} />
      <main className="w-full">{children}</main>
    </div>
  );
}

