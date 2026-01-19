'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import type { Ticket, Project } from '@/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Open: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/10' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/10' },
  Completed: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-600/10' },
  Cancelled: { bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-600/10' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/10' },
  'On Hold': { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-600/10' },
  Blocked: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-600/10' },
};

const Icons = {
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  ChevronLeft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
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
      <path d="M17.47 17c1.93.2 3.53-1.9 3.53 4" />
    </svg>
  ),
  Request: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-6Z"/>
      <path d="M13 3v18" opacity="0.3"/>
    </svg>
  ),
};

interface TicketListProps {
  initialTickets?: Ticket[];
  initialProjects?: Project[];
  initialTicketIdFilter?: string | null;
  initialRequesterName?: string | null;
  onRefresh?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TicketList({
  initialTickets = [],
  initialProjects = [],
  initialTicketIdFilter,
  initialRequesterName,
  onRefresh,
}: TicketListProps) {
  // Use SWR for automatic caching and request deduplication
  const { data: tickets = initialTickets, isLoading, mutate } = useSWR<Ticket[]>(
    '/api/tickets',
    fetcher,
    {
      fallbackData: initialTickets,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [failedReporterAvatars, setFailedReporterAvatars] = useState<Record<string, boolean>>({});

  // Filters
  const [ticketIdFilter, setTicketIdFilter] = useState(initialTicketIdFilter || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [requesterFilter, setRequesterFilter] = useState<DropdownOption | null>(
    initialRequesterName ? { id: initialRequesterName, name: initialRequesterName } : null
  );
  const [projectFilter, setProjectFilter] = useState<DropdownOption | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

  // Update ticket ID filter when initialTicketIdFilter changes
  useEffect(() => {
    if (initialTicketIdFilter) {
      setTicketIdFilter(initialTicketIdFilter);
    }
  }, [initialTicketIdFilter]);

  useEffect(() => {
    if (initialRequesterName) {
      setRequesterFilter({ id: initialRequesterName, name: initialRequesterName });
    }
  }, [initialRequesterName]);

  const requesters = useMemo(() => {
    const unique = Array.from(new Set(tickets.map((t) => t.requestedBy).filter(Boolean)));
    return unique.sort().map((name) => ({ id: name, name }));
  }, [tickets]);

  const projectOptions = useMemo(() => {
    const unique = Array.from(new Set(tickets.map((t) => t.projectName).filter((name) => name && name !== 'No Project')));
    return unique.sort().map((name) => ({ id: name, name }));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Ticket ID filter
      if (ticketIdFilter) {
        const idStr = ticketIdFilter.toLowerCase().replace('hrb-', '');
        const ticketDisplayId = ticket.display_id || ticket.id;
        const ticketIdForSearch = ticketDisplayId.toLowerCase().replace('hrb-', '');
        if (!ticketIdForSearch.includes(idStr)) return false;
      }

      // Search filter (title)
      if (searchFilter) {
        if (!ticket.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
      }

      // Requester filter
      if (requesterFilter && ticket.requestedBy !== requesterFilter.name) return false;

      // Project filter
      if (projectFilter && ticket.projectName !== projectFilter.name) return false;

      // Status filter
      if (statusFilter && ticket.status !== statusFilter) return false;

      // Type filter
      if (typeFilter && ticket.type !== typeFilter) return false;

      // Priority filter
      if (priorityFilter) {
        const ticketPriority = String(ticket.priority || '').toLowerCase();
        if (ticketPriority !== priorityFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [tickets, ticketIdFilter, searchFilter, requesterFilter, projectFilter, statusFilter, typeFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage
  );

  const startItem = filteredTickets.length === 0 ? 0 : (currentPage - 1) * ticketsPerPage + 1;
  const endItem = Math.min(currentPage * ticketsPerPage, filteredTickets.length);

  // Update page input when currentPage changes
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // Handle page input change
  const handlePageInputChange = (value: string) => {
    setPageInput(value);
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      setCurrentPage(1);
      setPageInput('1');
    } else if (pageNum > totalPages) {
      setCurrentPage(totalPages);
      setPageInput(String(totalPages));
    } else {
      setCurrentPage(pageNum);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setTicketsPerPage(value);
    setCurrentPage(1);
    setPageInput('1');
  };


  const handleCopyToClipboard = async (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    const ticketDisplayId = ticket.display_id || ticket.id;
    const textToCopy = `${ticketDisplayId.startsWith('HRB-') ? ticketDisplayId : `HRB-${ticketDisplayId}`} - ${ticket.title}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTicketId(ticket.id);
      // Reset the indicator after 2 seconds
      setTimeout(() => {
        setCopiedTicketId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Scroll to top smoothly when page changes
  useEffect(() => {
    const tableContainer = document.querySelector('[data-table-container]');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);


  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-blue-100/80">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '-') return { formatted: '-', relative: '' };
    
    try {
      // Parse the date - handle both ISO strings and formatted dates
      let date: Date;
      
      // If it's already in a formatted date string (e.g., "12/15/2024"), try to parse it
      if (dateString.includes('/')) {
        date = new Date(dateString);
      } else {
        // Try ISO format or other standard formats
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        // If parsing fails, return the original string
        return { formatted: dateString, relative: '' };
      }

      // Format: dd mmm yyyy (e.g., 15 Nov 2025)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const formatted = `${day} ${month} ${year}`;

      // Calculate relative time - normalize to start of day for accurate day calculation
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = todayStart.getTime() - dateStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      let relative = '';
      if (diffDays === 0) {
        relative = 'today';
      } else if (diffDays === 1) {
        relative = 'yesterday';
      } else if (diffDays >= 2 && diffDays <= 7) {
        relative = `${diffDays} days ago`;
      } else if (diffWeeks >= 1 && diffWeeks <= 5) {
        relative = `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
      } else if (diffMonths >= 1 && diffMonths <= 11) {
        relative = `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
      } else if (diffYears >= 1) {
        relative = `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
      }

      return { formatted, relative };
    } catch (error) {
      return { formatted: dateString, relative: '' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6 pt-4 pb-8">

      {/* Filters Area */}
      <div className="glass-panel p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-30">
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Search ID</label>
          <input
            type="text"
            value={ticketIdFilter}
            onChange={(e) => {
              setTicketIdFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="HRB-..."
            className="w-full h-11 px-4 text-sm glass-input rounded-xl font-normal placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Summary</label>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search titles..."
            className="w-full h-11 px-4 text-sm glass-input rounded-xl font-normal placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Status</label>
          <SearchableDropdown
            options={Object.keys(STATUS_COLORS).map(s => ({ id: s, name: s }))}
            placeholder="All Statuses"
            value={statusFilter}
            onSelect={(opt) => {
              setStatusFilter(opt?.name || '');
              setCurrentPage(1);
            }}
            allowClear
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
          <SearchableDropdown
            options={['Urgent', 'High', 'Medium', 'Low'].map(p => ({ id: p, name: p }))}
            placeholder="All Priorities"
            value={priorityFilter}
            onSelect={(opt) => {
              setPriorityFilter(opt?.name || '');
              setCurrentPage(1);
            }}
            allowClear
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Reporter</label>
          <SearchableDropdown
            options={requesters}
            placeholder="Select..."
            value={requesterFilter?.id}
            onSelect={(opt) => {
              setRequesterFilter(opt);
              setCurrentPage(1);
            }}
            allowClear
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] ml-1">Project</label>
          <SearchableDropdown
            options={projectOptions}
            placeholder="Select..."
            value={projectFilter?.id}
            onSelect={(opt) => {
              setProjectFilter(opt);
              setCurrentPage(1);
            }}
            allowClear
          />
        </div>
      </div>

      {/* Table Area */}
      <div
        data-table-container
        className="glass-panel overflow-hidden rounded-3xl relative z-10"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/30 border-b border-white/20">
                <th className="pl-8 pr-4 py-6 text-left text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]" style={{ width: '150px' }}>Issue ID</th>
                <th className="px-4 py-6 text-left text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Summary</th>
                <th className="px-4 py-6 text-center text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]" style={{ width: '130px' }}>Status</th>
                <th className="px-4 py-6 text-center text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]" style={{ width: '130px' }}>Priority</th>
                <th className="px-4 py-6 text-left text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]" style={{ width: '180px' }}>Reporter</th>
                <th className="pr-8 px-4 py-6 text-left text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]" style={{ width: '150px' }}>Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100/60 flex items-center justify-center animate-spin-slow">
                            <Icons.Plus className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] animate-pulse">Fetching records</p>
                       </div>
                    </td>
                  </tr>
                ) : paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-2">
                          <Icons.Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-medium">No tickets found</p>
                        <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="group hover:bg-white/40 transition-all duration-300"
                    >
                      <td className="pl-8 pr-4 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ticket.type === 'Bug' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                            {ticket.type === 'Bug' ? <Icons.Bug className="w-4 h-4" /> : <Icons.Request className="w-4 h-4" />}
                          </div>
                          <span className="text-sm font-light text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            {ticket.display_id || (ticket.id.startsWith('HRB-') ? ticket.id : `HRB-${ticket.id}`)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-middle">
                        <p className="text-sm font-light text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-1">
                          {highlightText(ticket.title, searchFilter)}
                        </p>
                      </td>
                      <td className="px-4 py-5 align-middle text-center">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-light ${STATUS_COLORS[ticket.status]?.bg || 'bg-slate-50'} ${STATUS_COLORS[ticket.status]?.text || 'text-slate-600'} border border-white/20 shadow-sm`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-5 align-middle text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            ticket.priority === 'Urgent' ? 'bg-rose-500 animate-pulse' :
                            ticket.priority === 'High' ? 'bg-blue-600' :
                            ticket.priority === 'Medium' ? 'bg-blue-500' :
                            'bg-slate-300'
                          }`} />
                          <span className="text-xs font-light text-slate-600">
                            {ticket.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-middle">
                        <div className="flex items-center gap-3">
                          {ticket.reporterAvatar && !failedReporterAvatars[ticket.id] ? (
                            <div className="relative w-8 h-8 flex-shrink-0">
                              <Image
                                src={ticket.reporterAvatar}
                                alt={ticket.requestedBy}
                                width={32}
                                height={32}
                                unoptimized
                                className="rounded-full object-cover ring-2 ring-white/10 shadow-sm"
                                onError={() => {
                                  const key = ticket.id;
                                  setFailedReporterAvatars((prev) => ({ ...prev, [key]: true }));
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-[10px] font-medium text-blue-600 shadow-sm">
                              {ticket.requestedBy?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="text-sm font-light text-slate-700 truncate max-w-[120px]">
                            {ticket.requestedBy}
                          </span>
                        </div>
                      </td>
                      <td className="pr-8 px-4 py-5 align-middle">
                        <div className="flex flex-col text-left">
                          <p className="text-xs font-light text-slate-900">{formatDate(ticket.created_at || '').formatted}</p>
                          <p className="text-[10px] font-light text-slate-400">{formatDate(ticket.created_at || '').relative}</p>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
        </div>

        {/* Pagination Part */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-white/20 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={ticketsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="h-10 px-4 text-xs font-medium text-slate-600 glass-button rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value={10}>10 View</option>
                <option value={25}>25 View</option>
                <option value={50}>50 View</option>
                <option value={100}>100 View</option>
              </select>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] border-l border-white/40 pl-4 h-5 flex items-center">
                Displaying {startItem}-{endItem} <span className="mx-1 opacity-40">/</span> {filteredTickets.length}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  setPageInput(String(newPage));
                }}
                disabled={currentPage === 1}
                className="p-2.5 glass-button rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <Icons.ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 px-4 py-2 glass-button rounded-xl shadow-sm">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  onBlur={handlePageInputBlur}
                  className="w-6 text-center bg-transparent text-sm font-medium text-blue-600 focus:outline-none"
                />
                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em] border-l border-white/40 pl-3">
                  of {totalPages}
                </span>
              </div>

              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                  setPageInput(String(newPage));
                }}
                disabled={currentPage === totalPages}
                className="p-2.5 glass-button rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <Icons.ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}


