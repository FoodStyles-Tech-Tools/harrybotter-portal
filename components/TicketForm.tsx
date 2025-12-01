'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import type { TeamMember, Project, TicketFormData } from '@/types';

const TYPE_OPTIONS = [
  {
    value: 'Request' as const,
    label: 'Request',
    icon: () => (
      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h6m6-6v10.5a2.5 2.5 0 01-2.5 2.5H7.5A2.5 2.5 0 015 16.5V5a2 2 0 012-2h8l4 4z" />
      </svg>
    ),
  },
  {
    value: 'Bug' as const,
    label: 'Bug',
    icon: () => (
      <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 11V6a2 2 0 014 0v5m1 8h-6a3 3 0 01-3-3v-4a6 6 0 0112 0v4a3 3 0 01-3 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9l2 2m12-2l-2 2M4 15h3m13 0h-3M6 19l2-2m10 2l-2-2" />
      </svg>
    ),
  },
];

const PRIORITY_OPTIONS = [
  {
    value: 'Low' as const,
    label: 'Low',
    icon: () => (
      <div className="w-4 h-4 flex items-center justify-center text-blue-600">
        <div className="w-2 h-2 border-b-2 border-r-2 border-current transform rotate-45 translate-y-1" />
      </div>
    ),
  },
  {
    value: 'Medium' as const,
    label: 'Medium',
    icon: () => (
      <div className="w-4 h-4 flex items-center justify-center">
        <div className="w-3 h-0.5 bg-yellow-500 rounded-sm" />
      </div>
    ),
  },
  {
    value: 'High' as const,
    label: 'High',
    icon: () => (
      <div className="w-4 h-4 flex items-center justify-center text-red-600">
        <div className="w-2 h-2 border-t-2 border-r-2 border-current transform rotate-45 -translate-y-1" />
      </div>
    ),
  },
  {
    value: 'Urgent' as const,
    label: 'Urgent',
    icon: () => (
      <div className="w-4 h-4 flex flex-col items-center justify-center text-red-600">
        <div className="w-2 h-2 border-t-2 border-r-2 border-current transform rotate-45 -translate-y-1" />
        <div className="w-2 h-2 border-t-2 border-r-2 border-current transform rotate-45 -translate-y-0.5" />
      </div>
    ),
  },
];

interface TicketFormProps {
  onSubmit: (payload: any) => Promise<void>;
  currentUser: {
    name: string;
    email?: string | null;
  };
  initialTeamMembers?: TeamMember[];
  initialProjects?: Project[];
  isLoading?: boolean;
  // Controlled form state (optional - for persistence across tab switches)
  formState?: {
    project: DropdownOption | null;
    assignee: DropdownOption | null;
    tickets: TicketFormData[];
  };
  onFormStateChange?: (state: {
    project: DropdownOption | null;
    assignee: DropdownOption | null;
    tickets: TicketFormData[];
  }) => void;
  onReset?: () => void;
}

export default function TicketForm({
  onSubmit,
  currentUser,
  initialTeamMembers = [],
  initialProjects = [],
  isLoading = false,
  formState,
  onFormStateChange,
  onReset,
}: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rephrasingIndex, setRephrasingIndex] = useState<number | null>(null);
  const [rephraseResult, setRephraseResult] = useState<{
    taskName: string;
    description: string;
    url: string;
  } | null>(null);
  const [isRephrasing, setIsRephrasing] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const [localProject, setLocalProject] = useState<DropdownOption | null>(null);
  const [localAssignee, setLocalAssignee] = useState<DropdownOption | null>(null);
  const [localTickets, setLocalTickets] = useState<TicketFormData[]>([
    {
      title: '',
      description: '',
      url: '',
      type: 'Request' as const,
      priority: 'Medium' as const,
      attachments: [],
      expectedDoneDate: null,
    },
  ]);

  const project = formState?.project ?? localProject;
  const assignee = formState?.assignee ?? localAssignee;
  const tickets = formState?.tickets ?? localTickets;
  const requester = currentUser;

  // Warn when page refresh/close during rephrase
  useEffect(() => {
    if (isRephrasing) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Rephrase operation is in progress. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isRephrasing]);

  // Expose rephrasing state to parent for tab switching warning
  useEffect(() => {
    if (typeof window !== 'undefined' && isRephrasing) {
      // Store in a way parent can check
      (window as any).__isRephrasing = true;
    } else {
      (window as any).__isRephrasing = false;
    }
  }, [isRephrasing]);

  const updateState = (updates: Partial<{
    project: DropdownOption | null;
    assignee: DropdownOption | null;
    tickets: TicketFormData[];
  }>) => {
    if (onFormStateChange) {
      onFormStateChange({
        project: updates.project ?? project,
        assignee: updates.assignee ?? assignee,
        tickets: updates.tickets ?? tickets,
      });
    } else {
      if (updates.project !== undefined) setLocalProject(updates.project);
      if (updates.assignee !== undefined) setLocalAssignee(updates.assignee);
      if (updates.tickets !== undefined) setLocalTickets(updates.tickets);
    }
  };


  const addTicketRow = () => {
    const newTicket: TicketFormData = {
      title: '',
      description: '',
      url: '',
      type: 'Request',
      priority: 'Medium',
      attachments: [],
      expectedDoneDate: null,
    };
    const newTickets = [...tickets, newTicket];
    updateState({ tickets: newTickets });
  };

  const removeTicketRow = (index: number) => {
    if (tickets.length > 1) {
      const newTickets = tickets.filter((_, i) => i !== index);
      updateState({ tickets: newTickets });
    }
  };

  const updateTicket = (index: number, field: keyof TicketFormData, value: any) => {
    const updated = [...tickets];
    updated[index] = { ...updated[index], [field]: value };
    updateState({ tickets: updated });
  };

  const handleRephrase = async (index: number) => {
    const ticket = tickets[index];
    if (!ticket.description || !ticket.description.trim()) {
      alert('Please enter a description to rephrase.');
      return;
    }

    setIsRephrasing(true);
    setRephrasingIndex(index);
    setRephraseResult(null);

    try {
      const response = await fetch('/api/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: ticket.description }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setRephraseResult({
        taskName: data.taskName,
        description: data.description,
        url: data.url || '',
      });
    } catch (error: any) {
      alert(`Failed to rephrase: ${error.message}`);
      setRephrasingIndex(null);
    } finally {
      setIsRephrasing(false);
    }
  };

  const handleAcceptRephrase = (index: number) => {
    if (!rephraseResult) return;

    const updated = [...tickets];
    updated[index] = {
      ...updated[index],
      title: rephraseResult.taskName,
      description: rephraseResult.description,
      url: rephraseResult.url || '',
    };
    
    updateState({ tickets: updated });
    setRephraseResult(null);
    setRephrasingIndex(null);
    
    // Auto-grow description field after accepting
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-ticket-index="${index}"][data-field="description"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 0);
  };

  const handleRejectRephrase = () => {
    setRephraseResult(null);
    setRephrasingIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester?.name) {
      alert('Your account is missing a display name. Please contact TechTool.');
      return;
    }

    const validTickets = tickets.filter((t) => t.title.trim());
    if (validTickets.length === 0) {
      alert('Please add at least one ticket.');
      return;
    }

    const requesterEmail = requester.email || '';

    setIsSubmitting(true);
    try {
      await onSubmit({
        requester: requester.name,
        requesterEmail,
        tickets: validTickets,
        projectId: project ? String(project.id) : null,
        assignee: assignee ? String(assignee.id) : null,
        assigneeName: assignee ? assignee.name : null,
      });

      // Only reset form after successful submission
      const resetTicket: TicketFormData = {
        title: '',
        description: '',
        url: '',
        type: 'Request',
        priority: 'Medium',
        attachments: [],
        expectedDoneDate: null,
      };
      const resetState = {
        project: null,
        assignee: null,
        tickets: [resetTicket],
      };
      updateState(resetState);
      if (onReset) {
        onReset();
      }
    } catch (error: any) {
      // Don't reset form on error - keep the data so user can retry
      // Error is already shown via toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions: DropdownOption[] = useMemo(
    () => initialProjects.map((p) => ({ id: p.id, name: p.name })),
    [initialProjects]
  );
  const assigneeOptions: DropdownOption[] = useMemo(
    () =>
      initialTeamMembers.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        avatar_url: m.avatar_url,
      })),
    [initialTeamMembers]
  );

  const handleProjectSelect = (selectedProject: DropdownOption | null) => {
    let nextAssignee: DropdownOption | null = assignee ?? null;

    if (selectedProject?.id) {
      const projectDetails = initialProjects.find(
        (projectItem) => String(projectItem.id) === String(selectedProject.id)
      );
      const ownerId = projectDetails?.owner_id;
      if (ownerId) {
        nextAssignee =
          assigneeOptions.find(
            (assigneeOption) => String(assigneeOption.id) === String(ownerId)
          ) ?? null;
      } else {
        nextAssignee = null;
      }
    } else {
      nextAssignee = null;
    }

    updateState({
      project: selectedProject,
      assignee: nextAssignee,
    });
  };

  useEffect(() => {
    const currentProjectId = project?.id ? String(project.id) : null;
    if (!currentProjectId) return;
    if (assignee) return;

    const projectDetails = initialProjects.find(
      (projectItem) => String(projectItem.id) === currentProjectId
    );
    const ownerId = projectDetails?.owner_id;
    if (!ownerId) return;

    const ownerAssignee =
      assigneeOptions.find((assigneeOption) => String(assigneeOption.id) === String(ownerId)) ??
      null;

    if (ownerAssignee) {
      updateState({ assignee: ownerAssignee });
    }
  }, [project?.id, initialProjects, assigneeOptions, assignee, updateState]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project (Optional)
          </label>
          <SearchableDropdown
            options={projectOptions}
            placeholder="Select project..."
            value={project?.id}
            onSelect={handleProjectSelect}
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
            onSelect={(value) => updateState({ assignee: value })}
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
                <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-700" style={{ width: '14%' }}>
                  Expected Done Date
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-700" style={{ width: '12%' }}>
                  Type
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left text-sm font-semibold text-gray-700" style={{ width: '12%' }}>
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
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Ticket *</label>
                        <textarea
                          value={ticket.title}
                          onChange={(e) => updateTicket(index, 'title', e.target.value)}
                          placeholder="Task title..."
                          required
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <div className="border border-blue-200 rounded p-2 bg-blue-50">
                          <textarea
                            data-ticket-index={index}
                            data-field="description"
                            value={ticket.description}
                            onChange={(e) => {
                              updateTicket(index, 'description', e.target.value);
                              // Auto-grow functionality
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onInput={(e) => {
                              // Auto-grow on input
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                            placeholder="Describe the task in detail..."
                            rows={3}
                            className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 resize-none min-h-[60px]"
                            style={{ overflow: 'hidden' }}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => handleRephrase(index)}
                              disabled={isRephrasing || !ticket.description?.trim()}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isRephrasing && rephrasingIndex === index ? (
                                <>
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Rephrasing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Rephrase &amp; Refine</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Url</label>
                        <input
                          type="url"
                          value={ticket.url || ''}
                          onChange={(e) => updateTicket(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {rephraseResult && rephrasingIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Task Name:</p>
                              <p className="text-sm text-gray-900">{rephraseResult.taskName}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Description:</p>
                              <p className="text-sm text-gray-900">{rephraseResult.description}</p>
                            </div>
                            {rephraseResult.url && rephraseResult.url.trim() && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">URL:</p>
                                <p className="text-sm text-blue-600 break-all">
                                  <a href={rephraseResult.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {rephraseResult.url}
                                  </a>
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => handleAcceptRephrase(index)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={handleRejectRephrase}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2" style={{ width: '14%' }}>
                    <input
                      type="date"
                      value={ticket.expectedDoneDate ?? ''}
                      onChange={(e) => updateTicket(index, 'expectedDoneDate', e.target.value || null)}
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-2" style={{ width: '12%' }}>
                    <select
                      value={ticket.type}
                      onChange={(e) => updateTicket(index, 'type', e.target.value)}
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Request">Request</option>
                      <option value="Bug">Bug</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-2 py-2" style={{ width: '12%' }}>
                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket(index, 'priority', e.target.value)}
                      className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

