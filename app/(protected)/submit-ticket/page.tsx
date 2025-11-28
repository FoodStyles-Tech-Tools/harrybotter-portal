'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TicketForm from '@/components/TicketForm';
import ToastContainer from '@/components/Toast';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/hooks/useToast';
import type { Project, TeamMember } from '@/types';

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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [membersRes, projectsRes] = await Promise.all([fetch('/api/team-members'), fetch('/api/projects')]);

        const [membersData, projectsData] = await Promise.all([membersRes.json(), projectsRes.json()]);

        setTeamMembers(membersData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Failed to load form data:', err);
        error('Failed to load form data. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [error]);

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      </motion.div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
