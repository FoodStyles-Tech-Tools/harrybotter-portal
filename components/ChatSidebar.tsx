'use client';

import { useState, useEffect } from 'react';

interface ChatSession {
  id: string;
  title: string;
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

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
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

  return (
    <div className="w-64 h-full bg-[#f0f4f9] flex flex-col flex-shrink-0 z-20 font-outfit border-r border-gray-200/50">
      {/* New Chat Button Area */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="group flex items-center justify-start gap-4 px-4 py-3 bg-white/50 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-100"
        >
          <div className="p-1.5 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <Icons.Plus className="w-5 h-5 text-blue-600" />
          </div>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 pt-4">
        
        {/* Chats History Section */}
        <div className="space-y-4">
          <div className="px-3 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <span>Recent Chats</span>
            <span className="w-2 h-2 rounded-full bg-blue-400/30" />
          </div>

          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-3 px-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-200/50 rounded animate-pulse w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-8 text-center bg-white/30 rounded-2xl border border-dashed border-gray-200">
                <p className="text-[11px] text-gray-400 font-medium">No recent activity</p>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 group text-left ${
                    currentSessionId === session.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 -translate-x-1'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-blue-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                    currentSessionId === session.id ? 'bg-blue-500/50 text-white' : 'bg-gray-200/40 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-400'
                  }`}>
                    <Icons.Chat className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{session.title || 'Untitled'}</span>
                    <span className={`text-[10px] mt-0.5 ${currentSessionId === session.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatRelativeTime(session.updated_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
