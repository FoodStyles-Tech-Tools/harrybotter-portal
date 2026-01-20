'use client';
import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import { authClient } from '@/lib/auth-client';
import { useToast } from '@/hooks/useToast';
import type { Project, TeamMember } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Icons = {
  Close: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Bug: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.31 0-6-2.69-6-6v-1h4v-3H6V8c0-3.31 2.69-6 6-6s6 2.69 6 6v2h-4v3h4v1c0 3.31-2.69 6-6 6Z" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H3" />
      <path d="M6.53 17c-1.93.2-3.53 1.9-3.53 4" />
      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
      <path d="M18 13h3" />
      <path d="M17.47 17c1.93.2 3.53 1.9 3.53 4" />
    </svg>
  ),
  Request: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  ),
};

export default function QuickAddModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const sessionState = authClient.useSession();
  
  const [type, setType] = useState<'Bug' | 'Request'>('Request');
  const [project, setProject] = useState<DropdownOption | null>(null);
  const [assignee, setAssignee] = useState<DropdownOption | null>(null);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  const { data: teamMembers = [] } = useSWR<TeamMember[]>('/api/team-members', fetcher);
  const { data: projects = [] } = useSWR<Project[]>('/api/projects', fetcher);

  const projectOptions: DropdownOption[] = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);
  const assigneeOptions: DropdownOption[] = useMemo(() => teamMembers.map(m => ({ id: m.id, name: m.name, email: m.email, avatar_url: m.avatar_url })), [teamMembers]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target as any).type === 'text'
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'c' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-quick-add', handleOpenModal);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-quick-add', handleOpenModal);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const userData = sessionState?.data?.user;
      const payload = {
        requester: userData?.name || 'TechTool User',
        requesterEmail: userData?.email || '',
        projectId: project ? String(project.id) : null,
        assignee: assignee ? String(assignee.id) : null,
        assigneeName: assignee ? assignee.name : null,
        tickets: [{
          title,
          description,
          url,
          type,
          priority,
          attachments: [],
          expectedDoneDate: null
        }]
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      success('Ticket created successfully!');
      setIsOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setUrl('');
      setProject(null);
      setAssignee(null);
      setType('Request');
      setPriority('Medium');
    } catch (err: any) {
      error(err.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-blue-900/30 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-panel bg-white rounded-[2rem] border border-white/60 shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 opacity-100 flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 sm:px-8 sm:pt-8 sm:pb-4 border-b border-white/40">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Create New Ticket</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/60 transition-all"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:px-8 sm:py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('Bug')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${
                  type === 'Bug' 
                    ? 'bg-rose-50 border-rose-300 text-rose-600' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <Icons.Bug className="w-6 h-6" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Bug</span>
                <p className="text-[10px] opacity-60">Report a problem</p>
              </button>
              <button
                type="button"
                onClick={() => setType('Request')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 ${
                  type === 'Request' 
                    ? 'bg-blue-50 border-blue-300 text-blue-600' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <Icons.Request className="w-6 h-6" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Request</span>
                <p className="text-[10px] opacity-60">Ask for a feature</p>
              </button>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Priority</label>
              <div className="flex items-center gap-2">
                {[
                  { id: 'Low', active: 'bg-slate-200 text-slate-700', idle: 'text-slate-500 hover:bg-slate-100' },
                  { id: 'Medium', active: 'bg-blue-500 text-white', idle: 'text-slate-500 hover:bg-blue-50' },
                  { id: 'High', active: 'bg-orange-500 text-white', idle: 'text-slate-500 hover:bg-orange-50' },
                  { id: 'Urgent', active: 'bg-red-500 text-white', idle: 'text-slate-500 hover:bg-red-50' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border border-transparent transition-all ${
                      priority === p.id ? p.active : p.idle
                    }`}
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Project</label>
                <SearchableDropdown
                  options={projectOptions}
                  placeholder="Optional"
                  value={project?.id}
                  onSelect={setProject}
                  allowClear
                  showAvatar={false}
                  className="!h-[42px] !rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Assignee</label>
                <SearchableDropdown
                  options={assigneeOptions}
                  placeholder="Optional"
                  value={assignee?.id}
                  onSelect={setAssignee}
                  allowClear
                  showAvatar={false}
                  className="!h-[42px] !rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Ticket Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What is the ticket title?"
                  required
                  className="w-full px-4 py-3.5 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/70 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the details..."
                  rows={4}
                  className="w-full px-4 py-3.5 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/70 transition-all text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Relevant Link</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white/70 transition-all text-xs"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-5 bg-white/40 border-t border-white/60 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/10 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-xs"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Create Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
