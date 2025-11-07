'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import TicketForm from '@/components/TicketForm';
import TicketList from '@/components/TicketList';
import ToastContainer from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import type { Ticket, User, TeamMember, Project, TicketFormData } from '@/types';
import type { DropdownOption } from '@/components/SearchableDropdown';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'submit' | 'check'>('submit');
  
  const handleTabChange = (tab: 'submit' | 'check') => {
    // Check if rephrase is in progress
    if (typeof window !== 'undefined' && (window as any).__isRephrasing) {
      const confirmLeave = window.confirm(
        'Rephrase operation is in progress. Are you sure you want to switch tabs? The rephrase operation will be cancelled.'
      );
      if (!confirmLeave) {
        return; // Don't switch tabs
      }
    }
    setActiveTab(tab);
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { toasts, success, error, removeToast } = useToast();
  
  // Cache form data to prevent reloading
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

  // Form state for persistence across tab switches
  const [formState, setFormState] = useState<{
    requester: DropdownOption | null;
    project: DropdownOption | null;
    assignee: DropdownOption | null;
    tickets: TicketFormData[];
  } | null>(null);

  // Load form data once on mount
  useEffect(() => {
    const loadFormData = async () => {
      if (formDataLoaded) return;
      try {
        const [usersRes, membersRes, projectsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/team-members'),
          fetch('/api/projects'),
        ]);

        const [usersData, membersData, projectsData] = await Promise.all([
          usersRes.json(),
          membersRes.json(),
          projectsRes.json(),
        ]);

        setUsers(usersData);
        setTeamMembers(membersData);
        setProjects(projectsData);
        setFormDataLoaded(true);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };
    loadFormData();
  }, [formDataLoaded]);

  // Load tickets once on mount or when needed
  useEffect(() => {
    const loadTickets = async () => {
      if (ticketsLoaded) return;
      try {
        const response = await fetch('/api/tickets');
        const data = await response.json();
        if (!data.error) {
          setTickets(data);
          setTicketsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load tickets:', error);
      }
    };
    loadTickets();
  }, [ticketsLoaded]);

  // Check if there's a ticket parameter in the URL
  const [initialTicketId, setInitialTicketId] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket');
      if (ticketParam) {
        setActiveTab('check');
        // Extract ticket ID (handle both "1279" and "HRB-1279" formats)
        const ticketId = ticketParam.replace(/^HRB-/i, '');
        setInitialTicketId(ticketId);
      }
    }
  }, []);

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

      // Show success notification
      success(data.message || 'Ticket(s) submitted successfully!');
      
      // Refresh ticket list
      const ticketsRes = await fetch('/api/tickets');
      const ticketsData = await ticketsRes.json();
      setTickets(ticketsData);
      setTicketsLoaded(true);
      
      // Switch to "Check Ticket" tab and filter to show the newly created ticket(s)
      setActiveTab('check');
      
      // If only one ticket was created, filter to show it
      if (data.ticketIds && data.ticketIds.length === 1) {
        setInitialTicketId(String(data.ticketIds[0]));
      } else if (data.ticketIds && data.ticketIds.length > 1) {
        // If multiple tickets, show the first one
        setInitialTicketId(String(data.ticketIds[0]));
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit ticket(s). Please try again.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <header className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Harry Botter Portal</h1>
            <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
          </header>

          <main className="p-6">
            {activeTab === 'submit' ? (
              <motion.div
                key="submit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Submit New Tickets</h2>
                  <p className="text-sm text-gray-600">
                    Use this section to request features, report bugs, or ask for assistance. Add
                    multiple tickets easily using the &apos;+&apos; button in each row.
                  </p>
                </div>
                <TicketForm 
                  onSubmit={handleTicketSubmit}
                  initialUsers={users}
                  initialTeamMembers={teamMembers}
                  initialProjects={projects}
                  isLoading={!formDataLoaded}
                  formState={formState || undefined}
                  onFormStateChange={setFormState}
                  onReset={() => setFormState(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="check"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Overview</h2>
                </div>
                <TicketList 
                  initialTickets={tickets} 
                  initialProjects={projects}
                  initialTicketIdFilter={initialTicketId}
                  onRefresh={() => {
                    setTicketsLoaded(false);
                  }}
                />
              </motion.div>
            )}
          </main>
        </motion.div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

