'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import type { User, TeamMember, Project, TicketFormData } from '@/types';

interface TicketFormProps {
  onSubmit: (payload: any) => Promise<void>;
  initialUsers?: User[];
  initialTeamMembers?: TeamMember[];
  initialProjects?: Project[];
  isLoading?: boolean;
}

export default function TicketForm({ 
  onSubmit, 
  initialUsers = [], 
  initialTeamMembers = [], 
  initialProjects = [],
  isLoading = false 
}: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [requester, setRequester] = useState<DropdownOption | null>(null);
  const [project, setProject] = useState<DropdownOption | null>(null);
  const [assignee, setAssignee] = useState<DropdownOption | null>(null);
  const [tickets, setTickets] = useState<TicketFormData[]>([
    { title: '', description: '', type: 'Request', priority: 'Medium', attachments: [] },
  ]);


  const addTicketRow = () => {
    setTickets([
      ...tickets,
      { title: '', description: '', type: 'Request', priority: 'Medium', attachments: [] },
    ]);
  };

  const removeTicketRow = (index: number) => {
    if (tickets.length > 1) {
      setTickets(tickets.filter((_, i) => i !== index));
    }
  };

  const updateTicket = (index: number, field: keyof TicketFormData, value: any) => {
    const updated = [...tickets];
    updated[index] = { ...updated[index], [field]: value };
    setTickets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester) {
      alert('Please select a requester.');
      return;
    }

    const validTickets = tickets.filter((t) => t.title.trim());
    if (validTickets.length === 0) {
      alert('Please add at least one ticket.');
      return;
    }

    const user = initialUsers.find((u) => u.name === requester.name);
    const requesterEmail = user?.email || '';

    setIsSubmitting(true);
    try {
      await onSubmit({
        requester: requester.name,
        requesterEmail,
        tickets: validTickets,
        projectId: project ? Number(project.id) : null,
        assignee: assignee ? Number(assignee.id) : null,
        assigneeName: assignee ? assignee.name : null,
      });

      // Reset form
      setRequester(null);
      setProject(null);
      setAssignee(null);
      setTickets([
        { title: '', description: '', type: 'Request', priority: 'Medium', attachments: [] },
      ]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions: DropdownOption[] = initialUsers.map((u) => ({ id: u.name, name: u.name, email: u.email }));
  const projectOptions: DropdownOption[] = initialProjects.map((p) => ({ id: p.id, name: p.name }));
  const assigneeOptions: DropdownOption[] = initialTeamMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requester *
          </label>
          <SearchableDropdown
            options={userOptions}
            placeholder="Select requester..."
            value={requester?.id}
            onSelect={setRequester}
            isLoading={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project (Optional)
          </label>
          <SearchableDropdown
            options={projectOptions}
            placeholder="Select project..."
            value={project?.id}
            onSelect={setProject}
            allowClear
            isLoading={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignee (Optional)
          </label>
          <SearchableDropdown
            options={assigneeOptions}
            placeholder="Select assignee..."
            value={assignee?.id}
            onSelect={setAssignee}
            allowClear
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tickets</h3>
          <button
            type="button"
            onClick={addTicketRow}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                  Details *
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                  Type
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                  Priority
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700 w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="border border-gray-300 px-3 py-2">
                    <textarea
                      value={ticket.title}
                      onChange={(e) => updateTicket(index, 'title', e.target.value)}
                      placeholder="Describe the bug or feature request..."
                      required
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <select
                      value={ticket.type}
                      onChange={(e) => updateTicket(index, 'type', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Request">Request</option>
                      <option value="Bug">Bug</option>
                      <option value="Task">Task</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket(index, 'priority', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeTicketRow(index)}
                      disabled={tickets.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Tickets
            </>
          )}
        </button>
      </div>
    </form>
  );
}

