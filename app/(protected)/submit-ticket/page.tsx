'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import TicketForm from '@/components/TicketForm';
import ToastContainer from '@/components/Toast';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/hooks/useToast';
import type { Project, TeamMember } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SubmitTicketPage() {
  const router = useRouter();
  const sessionState = authClient.useSession();
  const currentUser = useMemo(() => {
    const userData = sessionState?.data?.user;
    return {
      name: userData?.name ?? 'TechTool User',
      email: userData?.email ?? undefined,
    };
  }, [sessionState?.data?.user]);
  const { toasts, success, error, removeToast } = useToast();

  // Use SWR for automatic caching and request deduplication
  const { data: teamMembers = [], isLoading: loadingMembers } = useSWR<TeamMember[]>(
    '/api/team-members',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: projects = [], isLoading: loadingProjects } = useSWR<Project[]>(
    '/api/projects',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const isLoading = loadingMembers || loadingProjects;

  const handleTicketSubmit = async (payload: any) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      success(data.message || 'Ticket(s) submitted successfully!');

      const firstTicketId = data.ticketIds?.[0];
      if (firstTicketId) {
        router.push(`/check-ticket?ticket=${firstTicketId}`);
      } else {
        router.push('/check-ticket');
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit ticket(s). Please try again.');
      throw err;
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Submit New Tickets</h2>
          <p className="text-sm text-gray-600">
            Use this section to request features, report bugs, or ask for assistance. Add multiple tickets easily using the &apos;+&apos; button in each row.
          </p>
        </div>
        <TicketForm
          onSubmit={handleTicketSubmit}
          currentUser={currentUser}
          initialTeamMembers={teamMembers}
          initialProjects={projects}
          isLoading={isLoading}
        />
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
