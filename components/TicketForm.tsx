'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import type { TeamMember, Project, TicketFormData } from '@/types';

const Icons = {
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),
};

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
        <div className="w-3 h-0.5 bg-blue-400 rounded-sm" />
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

  const updateState = useCallback((updates: Partial<{
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
  }, [onFormStateChange, project, assignee, tickets]);


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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 glass-panel rounded-[1.5rem] border border-white/40 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
            Project (Optional)
          </label>
          <SearchableDropdown
            options={projectOptions}
            placeholder="Select project..."
            value={project?.id}
            onSelect={handleProjectSelect}
            allowClear
            isLoading={isLoading}
            showAvatar={false}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
            Assignee (Optional)
          </label>
          <SearchableDropdown
            options={assigneeOptions}
            placeholder="Select assignee..."
            value={assignee?.id}
            onSelect={(value) => updateState({ assignee: value })}
            allowClear
            isLoading={isLoading}
            showAvatar={false}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Tickets</h3>
          <button
            type="button"
            onClick={addTicketRow}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-blue-600 bg-white/70 border border-blue-100/70 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-blue-100 active:scale-[0.98] backdrop-blur-sm group"
          >
            <Icons.Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
            Add Row
          </button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/40 shadow-sm bg-white/25 backdrop-blur-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/40 border-b border-white/40">
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Details *
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]" style={{ width: '14%' }}>
                  Expected Done
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]" style={{ width: '12%' }}>
                  Type
                </th>
                <th className="px-2 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]" style={{ width: '12%' }}>
                  Priority
                </th>
                <th className="px-3 py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/40 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="space-y-1.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-0.5">Ticket *</label>
                        <textarea
                          value={ticket.title}
                          onChange={(e) => updateTicket(index, 'title', e.target.value)}
                          placeholder="Task title..."
                          required
                          rows={1}
                          className="w-full px-2.5 py-1 text-[0.9rem] bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all resize-none shadow-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-0.5 ml-1">Description</label>
                        <div className="border border-white/50 rounded-xl p-2 bg-white/30 shadow-sm group focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:bg-white/70 transition-all">
                          <textarea
                            data-ticket-index={index}
                            data-field="description"
                            value={ticket.description}
                            onChange={(e) => {
                              updateTicket(index, 'description', e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = `${target.scrollHeight}px`;
                            }}
                            placeholder="Describe the task in detail..."
                            rows={2}
                            className="w-full px-2 py-0.5 text-[0.85rem] border-0 bg-transparent focus:outline-none focus:ring-0 resize-none min-h-[30px] leading-relaxed text-slate-600"
                            style={{ overflow: 'hidden' }}
                          />
                          <div className="flex justify-end mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleRephrase(index)}
                              disabled={isRephrasing || !ticket.description?.trim()}
                              className="group flex items-center gap-1.5 px-2.5 py-1 text-[0.65rem] font-bold text-blue-600 bg-blue-50/70 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wider"
                            >
                              {isRephrasing && rephrasingIndex === index ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Wizard thinking...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Rephrase with Wizard</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-0.5 ml-1">Url (Optional)</label>
                        <input
                          type="url"
                          value={ticket.url || ''}
                          onChange={(e) => updateTicket(index, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 text-sm bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      {rephraseResult && rephrasingIndex === index && (
                        <div
                          className="p-2 bg-blue-50/80 border border-blue-200 rounded-lg"
                        >
                          <div className="space-y-1.5">
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-1">Task Name:</p>
                              <p className="text-sm text-slate-900">{rephraseResult.taskName}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-1">Description:</p>
                              <p className="text-sm text-slate-900">{rephraseResult.description}</p>
                            </div>
                            {rephraseResult.url && rephraseResult.url.trim() && (
                              <div>
                                <p className="text-xs font-semibold text-slate-700 mb-1">URL:</p>
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
                        </div>
                      )}
                    </div>
                  </td>
                   <td className="px-2 py-2" style={{ width: '14%' }}>
                    <input
                      type="date"
                      value={ticket.expectedDoneDate ?? ''}
                      onChange={(e) => updateTicket(index, 'expectedDoneDate', e.target.value || null)}
                      className="w-full px-2 py-1.5 text-xs bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </td>
                  <td className="px-2 py-2" style={{ width: '12%' }}>
                    <select
                      value={ticket.type}
                      onChange={(e) => updateTicket(index, 'type', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="Request">Request</option>
                      <option value="Bug">Bug</option>
                    </select>
                  </td>
                  <td className="px-2 py-2" style={{ width: '12%' }}>
                    <select
                      value={ticket.priority}
                      onChange={(e) => updateTicket(index, 'priority', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeTicketRow(index)}
                      disabled={tickets.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="text-sm">Submit Tickets</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

