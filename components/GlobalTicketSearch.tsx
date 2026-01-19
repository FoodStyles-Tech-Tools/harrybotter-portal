'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import type { Ticket } from '@/types';

export default function GlobalTicketSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionState = authClient.useSession();
  const currentUserName = sessionState?.data?.user?.name ?? null;

  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditableTarget(event.target)) {
          return;
        }
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    setTimeout(() => inputRef.current?.focus(), 0);
    document.body.style.overflow = 'hidden';

    if (tickets.length === 0) {
      setIsLoading(true);
      fetch('/api/tickets')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTickets(data);
          }
        })
        .catch((error) => {
          console.error('Failed to load tickets', error);
        })
        .finally(() => setIsLoading(false));
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, tickets.length]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return tickets
      .filter((ticket) => {
        const displayId = String(ticket.display_id || ticket.id).toLowerCase();
        const title = (ticket.title || '').toLowerCase();
        const requester = (ticket.requestedBy || '').toLowerCase();
        return (
          displayId.includes(normalized) ||
          title.includes(normalized) ||
          requester.includes(normalized)
        );
      })
      .slice(0, 8);
  }, [query, tickets]);

  const recentTickets = useMemo(() => {
    if (!currentUserName) return [];
    return [...tickets]
      .filter((ticket) => ticket.requestedBy === currentUserName)
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
        const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [tickets, currentUserName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-20 z-[90] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-blue-900/30"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-xl glass-panel bg-white rounded-[1.75rem] border border-white/70 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.45)] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/60">
          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Search Tickets
          </span>
          <kbd className="ml-auto inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-light text-slate-600 shadow-sm">
            /
          </kbd>
        </div>
        <div className="px-5 py-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type ticket ID, summary, or reporter..."
            className="w-full h-12 px-4 text-sm glass-input rounded-xl font-light text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="max-h-80 overflow-y-auto px-3 pb-4">
          {isLoading ? (
            <div className="px-3 py-6 text-center text-xs font-light text-slate-400">
              Loading tickets...
            </div>
          ) : query.trim().length === 0 ? (
            recentTickets.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs font-light text-slate-400">
                Start typing to search tickets.
              </div>
            ) : (
              <div className="space-y-2 px-2 pb-2">
                <div className="px-2 pt-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Recent Tickets
                </div>
                {recentTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      const target = ticket.display_id || ticket.id;
                      router.push(`/tickets?ticket=${encodeURIComponent(String(target))}`);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-light text-slate-700 hover:bg-white/80 transition-all"
                  >
                    <span className="text-xs text-blue-600 font-light">
                      {ticket.display_id || ticket.id}
                    </span>
                    <span className="flex-1 truncate">{ticket.title}</span>
                    <span className="text-xs text-slate-400">{ticket.status}</span>
                  </button>
                ))}
              </div>
            )
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs font-light text-slate-400">
              No matching tickets.
            </div>
          ) : (
            results.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => {
                  const target = ticket.display_id || ticket.id;
                  router.push(`/tickets?ticket=${encodeURIComponent(String(target))}`);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-light text-slate-700 hover:bg-white/80 transition-all"
              >
                <span className="text-xs text-blue-600 font-light">
                  {ticket.display_id || ticket.id}
                </span>
                <span className="flex-1 truncate">{ticket.title}</span>
                <span className="text-xs text-slate-400">{ticket.status}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
