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
  const ticketId = searchParams.get('ticketId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    const sessionData = await supabaseRequest('chat_sessions', {
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
    });

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const params = ticketId
      ? `session_id=eq.${sessionId}&ticket_id=eq.${ticketId}`
      : `session_id=eq.${sessionId}`;
    const feedback = await supabaseRequest('chat_feedback', { params });
    return NextResponse.json(feedback);
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
    const { sessionId, ticketId, rating, feedback } = await request.json();

    if (!sessionId || !ticketId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (Number.isNaN(Number(rating)) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const sessionData = await supabaseRequest('chat_sessions', {
      params: `id=eq.${sessionId}&user_id=eq.${session.user.id}`,
    });

    if (!sessionData || sessionData.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const existingFeedback = await supabaseRequest('chat_feedback', {
      params: `session_id=eq.${sessionId}&ticket_id=eq.${ticketId}`,
    });

    if (Array.isArray(existingFeedback) && existingFeedback.length > 0) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 });
    }

    const newFeedback = await supabaseRequest('chat_feedback', {
      method: 'POST',
      payload: {
        session_id: sessionId,
        ticket_id: ticketId,
        user_id: session.user.id,
        rating,
        feedback: feedback || null,
      },
    });

    return NextResponse.json(newFeedback[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
