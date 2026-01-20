'use client';

import { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  title: string;
  ticket_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

  const Icons = {
  History: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),
  Chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  ),
  Clock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Tool: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 14 4-4 4 4-4 4Z" />
      <path d="M12 14c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2s2 .9 2 2v8c0 1.1-.9 2-2 2Z" />
      <path d="M12 14c-1.1 0-2.1.4-2.8 1.2L5 19c-.6.6-.6 1.4 0 2 .3.3.7.5 1.1.5s.8-.2 1.1-.5L11 17.2c.2-.2.5-.2.7 0l3.8 3.8c.3.3.7.5 1.1.5s.8-.2 1.1-.5c.6-.6.6-1.4 0-2l-4.2-3.8c-.7-.8-1.7-1.2-2.8-1.2Z" />
    </svg>
  ),
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackBySessionId, setFeedbackBySessionId] = useState<Record<string, boolean>>({});

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);

        const sessionIds = (data as ChatSession[]).map((session) => session.id);
        if (sessionIds.length > 0) {
          const feedbackRes = await fetch('/api/chat/feedback?summary=1');
          if (feedbackRes.ok) {
            const feedbackData = await feedbackRes.json();
            const feedbackMap: Record<string, boolean> = {};
            for (const entry of feedbackData || []) {
              if (entry?.session_id) {
                feedbackMap[entry.session_id] = true;
              }
            }
            setFeedbackBySessionId(feedbackMap);
          } else {
            setFeedbackBySessionId({});
          }
        } else {
          setFeedbackBySessionId({});
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, [currentSessionId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        const res = await fetch(`/api/chat/sessions?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (currentSessionId === id) {
            onNewChat();
          }
        }
      } catch (error) {
        console.error('Failed to delete session', error);
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(id);
      // Auto-reset after 3s
      setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
    }
  };

  return (
    <div className="w-72 lg:w-80 h-full glass-panel flex flex-col flex-shrink-0 z-20 border-r border-white/30">
      {/* New Chat Button Area */}
      <div className="p-6">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-normal border border-slate-200 shadow-sm"
        >
          <Icons.Edit className="w-4 h-4 text-slate-500" />
          New chat
        </button>
      </div>


      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 pt-2">
        
        {/* Chats History Section */}
        <div className="space-y-4">
          <div className="px-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Chats</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 opacity-50" />
            </div>
          </div>

          <div className="space-y-1.5">
            {isLoading ? (
              <div className="space-y-3 px-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 glass-button rounded-2xl animate-pulse w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-4 py-10 text-center glass-button rounded-2xl border-dashed border-white/50">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.2em] italic">No history yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all duration-200 group text-left ${
                    currentSessionId === session.id
                      ? 'bg-blue-100/80 text-blue-700'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-normal">
                      {session.ticket_id || session.title || 'Untitled Session'}
                    </span>
                    <span className={`text-[10px] font-normal ${currentSessionId === session.id ? 'text-blue-600/70' : 'text-slate-400'}`}>
                      {formatRelativeTime(session.updated_at)}
                    </span>
                    {session.ticket_id && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Created
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Feedback {feedbackBySessionId[session.id] ? "✓" : "○"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className={`p-2 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 flex-shrink-0 ${
                      deletingId === session.id
                        ? 'bg-rose-500 text-white opacity-100 animate-pulse'
                      : currentSessionId === session.id
                        ? 'hover:bg-white/80 text-rose-500'
                        : 'hover:bg-white text-rose-500 shadow-sm'
                    }`}
                    title={deletingId === session.id ? 'Click to confirm delete' : 'Delete'}
                  >
                    {deletingId === session.id ? (
                      <span className="text-[10px] font-semibold px-1">Confirm</span>
                    ) : (
                      <Icons.Trash className="w-3.5 h-3.5" />
                    )}
                  </button>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
