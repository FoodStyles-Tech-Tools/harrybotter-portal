'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import TicketForm from '@/components/TicketForm';
import TicketList from '@/components/TicketList';
import type { Ticket, User, TeamMember, Project } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'submit' | 'check'>('submit');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Cache form data to prevent reloading
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);

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

  // Check if there's a viewTicket parameter in the URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewTicket = params.get('viewTicket');
      if (viewTicket) {
        setActiveTab('check');
      }
    }
  }, []);

  const handleTicketSubmit = async (payload: any) => {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    alert(data.message);
    // Refresh ticket list if on check tab
    if (activeTab === 'check') {
      const ticketsRes = await fetch('/api/tickets');
      const ticketsData = await ticketsRes.json();
      setTickets(ticketsData);
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
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
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
                    multiple tickets easily using the '+' button in each row.
                  </p>
                </div>
                <TicketForm 
                  onSubmit={handleTicketSubmit}
                  initialUsers={users}
                  initialTeamMembers={teamMembers}
                  initialProjects={projects}
                  isLoading={!formDataLoaded}
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
                  onRefresh={() => {
                    setTicketsLoaded(false);
                  }}
                />
              </motion.div>
            )}
          </main>
        </motion.div>
      </div>
    </div>
  );
}

