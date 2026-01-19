'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TicketList from '@/components/TicketList';
import type { Project, Ticket } from '@/types';

function TicketPageContent() {
  const params = useParams();
  const router = useRouter();
  const displayId = params?.displayId as string;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [ticketsRes, projectsRes] = await Promise.all([
          fetch('/api/tickets'),
          fetch('/api/projects'),
        ]);

        const [ticketsData, projectsData] = await Promise.all([
          ticketsRes.json(),
          projectsRes.json(),
        ]);

        if (ticketsData.error) {
          throw new Error(ticketsData.error);
        }

        if (projectsData.error) {
          throw new Error(projectsData.error);
        }

        setTickets(ticketsData);
        setProjects(projectsData);
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError(err.message || 'Failed to load ticket data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/check-ticket')}
            className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"
          >
            Go to Check Ticket
          </button>
        </div>
      </div>
    );
  }

  const normalizedDisplayId = displayId?.toLowerCase().replace(/^hrb-/, '') || '';
  const ticketExists = tickets.some((ticket) => {
    const ticketDisplayId = (ticket.display_id || ticket.id).toLowerCase().replace(/^hrb-/, '');
    return ticketDisplayId === normalizedDisplayId;
  });

  if (!ticketExists && displayId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            Ticket <strong>{displayId.toUpperCase()}</strong> not found.
          </p>
          <button
            onClick={() => router.push('/check-ticket')}
            className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700"
          >
            Go to Check Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-[2rem] shadow-sm border border-white/60 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ticket Overview</h2>
      </div>
      <TicketList initialTickets={tickets} initialProjects={projects} initialTicketIdFilter={displayId} />
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center glass-panel rounded-2xl px-6 py-4 border border-white/60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <TicketPageContent />
    </Suspense>
  );
}
