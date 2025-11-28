const SUPABASE_ADMIN_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ADMIN_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase admin credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are required.');
}

export async function isUserAllowed(email?: string | null): Promise<boolean> {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase();
  const response = await fetch(
    `${SUPABASE_ADMIN_URL}/rest/v1/users?select=id&email=eq.${encodeURIComponent(normalizedEmail)}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
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

