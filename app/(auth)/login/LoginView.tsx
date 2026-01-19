'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

interface LoginViewProps {
  initialError?: string;
}

export default function LoginView({ initialError }: LoginViewProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const { data, error: signInError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/popup-callback',
        disableRedirect: true,
      });

      if (signInError) {
        throw new Error(signInError.message ?? 'Failed to start Google sign in.');
      }

      if (!data?.url) {
        throw new Error('Google sign in did not return a redirect URL.');
      }

      const width = 500;
      const height = 600;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      const popup = window.open(
        data.url,
        'googleSignIn',
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups and try again.');
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.data === 'login-success') {
          window.location.assign('/chat');
          if (!popup.closed) {
            popup.close();
          }
        }
      };

      window.addEventListener('message', messageHandler);

      const pollForSession = window.setInterval(async () => {
        try {
          const { data: sessionData } = await authClient.getSession();
          if (sessionData?.session) {
            window.clearInterval(pollForSession);
            window.removeEventListener('message', messageHandler);
            if (!popup.closed) {
              popup.close();
            }
            window.location.assign('/chat');
            return;
          }
        } catch {
          // Ignore transient session fetch failures while the popup is open.
        }

        if (popup.closed) {
          window.clearInterval(pollForSession);
          window.removeEventListener('message', messageHandler);
          setIsSigningIn(false);
        }
      }, 750);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start Google sign in.';
      setError(message);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md glass-panel rounded-[2rem] shadow-[0_24px_80px_-60px_rgba(37,99,235,0.5)] border border-white/60 p-8">
        <div className="text-center mb-8 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/70 font-semibold">Welcome</p>
          <h1 className="text-3xl font-semibold text-slate-900">Harry Botter Portal</h1>
          <p className="text-slate-500">Sign in to submit or track your tickets.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.45)] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70 transition-all"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.645h6.5a5.54 5.54 0 0 1-2.4 3.634v3.02h3.884c2.275-2.095 3.536-5.186 3.536-8.844z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.24 0 5.956-1.073 7.941-2.916l-3.884-3.02c-1.076.72-2.45 1.15-4.057 1.15-3.12 0-5.76-2.108-6.702-4.946H1.29v3.11A12 12 0 0 0 12 24z"
              fill="#34A853"
            />
            <path
              d="M5.298 14.268A7.21 7.21 0 0 1 4.92 12c0-.786.135-1.548.378-2.268V6.622H1.29A12 12 0 0 0 0 12c0 1.933.46 3.757 1.29 5.378l4.008-3.11z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.764 0 3.346.607 4.592 1.797l3.444-3.444C17.952 1.18 15.236 0 12 0 7.313 0 3.267 2.69 1.29 6.622l4.008 3.11C6.24 6.858 8.88 4.75 12 4.75z"
              fill="#EA4335"
            />
          </svg>
          {isSigningIn ? 'Opening Google…' : 'Continue with Google'}
        </button>

      </div>
    </div>
  );
}
