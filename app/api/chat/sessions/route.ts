import { NextResponse } from 'next/server';
import { getBetterAuthSession } from '@/lib/server-session';
import { supabaseRequest } from '@/services/supabase';

export async function GET() {
  const session = await getBetterAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await supabaseRequest('chat_sessions', {
      params: `user_id=eq.${session.user.id}&order=updated_at.desc`,
    });
    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getBetterAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title } = await request.json();
    const newSession = await supabaseRequest('chat_sessions', {
      method: 'POST',
      payload: {
        user_id: session.user.id,
        title: title || 'New Chat',
      },
    });
    return NextResponse.json(newSession[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
