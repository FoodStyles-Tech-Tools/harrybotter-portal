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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">Login Successful</h2>
        <p className="mt-2 text-gray-600">You can now close this window.</p>
      </div>
    </div>
  );
}
