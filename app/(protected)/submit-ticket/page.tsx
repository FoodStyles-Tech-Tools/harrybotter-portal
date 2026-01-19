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
        router.push(`/tickets?ticket=${firstTicketId}`);
      } else {
        router.push('/tickets');
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit ticket(s). Please try again.');
      throw err;
    }
  };

  return (
    <>
      <div className="flex-1 w-full px-4 md:px-10 py-8 flex flex-col">
        <div className="glass-panel rounded-[2rem] p-1 md:p-2 border border-white/60 shadow-[0_20px_60px_-40px_rgba(37,99,235,0.35)]">
          <TicketForm
            onSubmit={handleTicketSubmit}
            currentUser={currentUser}
            initialTeamMembers={teamMembers}
            initialProjects={projects}
            isLoading={isLoading}
          />
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
