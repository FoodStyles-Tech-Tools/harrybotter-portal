'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TicketList from '@/components/TicketList';
import type { Ticket, Project } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if ticket exists
  const normalizedDisplayId = displayId?.toLowerCase().replace(/^hrb-/, '') || '';
  const ticketExists = tickets.some((ticket) => {
    const ticketDisplayId = (ticket.display_id || ticket.id).toLowerCase().replace(/^hrb-/, '');
    return ticketDisplayId === normalizedDisplayId;
  });

  if (!ticketExists && displayId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Ticket <strong>{displayId.toUpperCase()}</strong> not found.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Harry Botter Portal</h1>
            <Navigation activeTab="check" onTabChange={() => router.push('/')} />
          </header>

          <main className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Overview</h2>
            </div>
            <TicketList 
              initialTickets={tickets} 
              initialProjects={projects}
              initialTicketDisplayId={displayId}
              onRefresh={() => {
                // Reload tickets on refresh
                fetch('/api/tickets')
                  .then(res => res.json())
                  .then(data => {
                    if (!data.error) {
                      setTickets(data);
                    }
                  });
              }}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TicketPageContent />
    </Suspense>
  );
}


