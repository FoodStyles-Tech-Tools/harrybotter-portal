import { NextResponse } from 'next/server';
import { getBetterAuthSession } from '@/lib/server-session';
import { supabaseRequest } from '@/services/supabase';

export async function GET(request: Request) {
  const session = await getBetterAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    // Verify session belongs to user
    const sessionData = await supabaseRequest('chat_sessions', {
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
    });

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await supabaseRequest('chat_messages', {
      params: `session_id=eq.${sessionId}&order=created_at.asc`,
    });
    return NextResponse.json(messages);
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
    const { sessionId, sender, text, buttons } = await request.json();

    if (!sessionId || !sender || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify session belongs to user
    const sessionData = await supabaseRequest('chat_sessions', {
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
    });

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const newMessage = await supabaseRequest('chat_messages', {
      method: 'POST',
      payload: {
        session_id: sessionId,
        sender,
        text,
        buttons: buttons || null,
      },
    });

    // Update session timestamp
    await supabaseRequest('chat_sessions', {
      method: 'PATCH',
      params: `id=eq.${sessionId}`,
      payload: { updated_at: new Date().toISOString() },
    });

    return NextResponse.json(newMessage[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
