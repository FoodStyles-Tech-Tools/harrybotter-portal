'use client';

import { useEffect } from 'react';

export default function PopupCallbackPage() {
  useEffect(() => {
    // Notify the parent window/opener that the login was successful.
    if (window.opener) {
      window.opener.postMessage('login-success', '*');
      window.close();
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass-panel rounded-2xl px-6 py-4 border border-white/60 text-center shadow-[0_20px_60px_-40px_rgba(37,99,235,0.35)]">
        <h2 className="text-lg font-semibold text-slate-900">Login Successful</h2>
        <p className="mt-2 text-slate-500">You can now close this window.</p>
      </div>
    </div>
  );
}
