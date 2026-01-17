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

export async function PATCH(request: Request) {
  const session = await getBetterAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId, ticketId } = await request.json();
    if (!sessionId || !ticketId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedSession = await supabaseRequest('chat_sessions', {
      method: 'PATCH',
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
      payload: {
        ticket_id: ticketId,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(updatedSession[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getBetterAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await supabaseRequest('chat_sessions', {
      method: 'DELETE',
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
