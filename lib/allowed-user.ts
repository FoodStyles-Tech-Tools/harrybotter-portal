export async function isUserAllowed(email?: string | null): Promise<boolean> {
  const SUPABASE_ADMIN_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_ADMIN_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase admin credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing.');
    return false;
  }

  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();
  const headers = new Headers();
  headers.set('apikey', SUPABASE_SERVICE_ROLE_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);

  const response = await fetch(
    `${SUPABASE_ADMIN_URL}/rest/v1/users?select=id&email=eq.${encodeURIComponent(normalizedEmail)}`,
    {
      headers,
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    console.error('Failed to verify user against Supabase users table', {
      status: response.status,
      statusText: response.statusText,
    });
    return false;
  }

  const data = (await response.json()) as Array<{ id: string }>;
  return Array.isArray(data) && data.length > 0;
}
