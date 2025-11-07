const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export interface SupabaseRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  params?: string;
  payload?: any;
}

export async function supabaseRequest(
  table: string,
  options: SupabaseRequestOptions = {}
): Promise<any> {
  const { method = 'GET', params = '', payload = null } = options;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL and Key are not configured.');
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? `?${params}` : ''}`;
  const requestOptions: RequestInit = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  };

  if (payload) {
    requestOptions.body = JSON.stringify(payload);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Supabase request failed for ${table}. Code: ${response.status}. Body: ${errorText}`);
    throw new Error(`Database operation failed: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data;
  }

  return null;
}

