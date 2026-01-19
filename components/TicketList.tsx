'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import TicketDrawer from './TicketDrawer';
import type { Ticket, Project } from '@/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Open: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/10' },
  'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/10' },
  Completed: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/10' },
  Cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-600/10' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/10' },
  'On Hold': { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-600/10' },
  Blocked: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/10' },
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

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

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
      if (priorityFilter && ticket.priority !== priorityFilter) return false;

      return true;
    });
  }, [tickets, ticketIdFilter, searchFilter, requesterFilter, projectFilter, statusFilter, typeFilter]);

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

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
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
        <mark key={i} className="bg-yellow-200">
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
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              {filteredTickets.length} Tickets Found
            </span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] uppercase tracking-wider"
          >
            <Icons.Plus className="w-4 h-4 text-blue-600" />
            New Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-5 bg-white border-b border-gray-100 shadow-sm transition-all duration-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Ticket ID</label>
            <input
              type="text"
              value={ticketIdFilter}
              onChange={(e) => {
                setTicketIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="HRB-123..."
              className="w-full h-[38px] px-3 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Search Title</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full h-[38px] px-3 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-3 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_COLORS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-3 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px' }}
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Requester</label>
            <SearchableDropdown
              options={requesters}
              placeholder="Select..."
              value={requesterFilter?.id}
              onSelect={(opt) => {
                setRequesterFilter(opt);
                setCurrentPage(1);
              }}
              allowClear
              className="!h-[38px] !rounded-lg !border-gray-200 !bg-white !shadow-none !text-[13px] !font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-widest">Project</label>
            <SearchableDropdown
              options={projectOptions}
              placeholder="Select..."
              value={projectFilter?.id}
              onSelect={(opt) => {
                setProjectFilter(opt);
                setCurrentPage(1);
              }}
              allowClear
              className="!h-[38px] !rounded-lg !border-gray-200 !bg-white !shadow-none !text-[13px] !font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div
          data-table-container
          className="bg-white/30 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-200 font-outfit"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-5 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '140px' }}>
                    Issue
                  </th>
                  <th className="px-4 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest">
                    Summary
                  </th>
                  <th className="px-3 py-4 text-center text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '120px' }}>
                    Status
                  </th>
                  <th className="px-3 py-4 text-center text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '120px' }}>
                    Priority
                  </th>
                  <th className="px-3 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '150px' }}>
                    Reporter
                  </th>
                  <th className="px-3 py-4 text-left text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '120px' }}>
                    Created
                  </th>
                  <th className="px-5 py-4 text-center text-[0.7rem] font-bold text-gray-400 uppercase tracking-widest" style={{ width: '80px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Icons.Search className="w-10 h-10 text-gray-300" />
                          <span className="text-gray-500 font-medium">No tickets found matching your filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="group border-b border-gray-50/50 hover:bg-gray-50/80 transition-all duration-200"
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          {ticket.type === 'Bug' ? (
                            <Icons.Bug className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Icons.Request className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-[0.8rem] font-bold text-gray-400 tracking-tight">
                            {ticket.display_id || (ticket.id.startsWith('HRB-') ? ticket.id : `HRB-${ticket.id}`)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="text-[0.85rem] font-normal text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {highlightText(ticket.title, searchFilter)}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-middle text-center">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium shadow-sm ${STATUS_COLORS[ticket.status]?.bg || 'bg-gray-50'} ${STATUS_COLORS[ticket.status]?.text || 'text-gray-600'} border border-gray-100`}>
                            {ticket.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-2 h-2 rounded-sm ${
                            ticket.priority === 'Urgent' ? 'bg-red-500' :
                            ticket.priority === 'High' ? 'bg-orange-500' :
                            ticket.priority === 'Medium' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-[0.75rem] font-normal text-gray-600">
                            {ticket.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-semibold text-blue-600">
                            {ticket.requestedBy?.charAt(0) || 'U'}
                          </div>
                          <span className="text-[0.75rem] font-normal text-gray-600 truncate max-w-[100px]">
                            {ticket.requestedBy}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-[0.75rem] font-normal">
                            {ticket.created_at ? formatDate(ticket.created_at).relative : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle text-center">
                        <button
                          onClick={() => handleTicketClick(ticket)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-5 bg-white/40 border-t border-white/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={ticketsPerPage}
                  onChange={(e) => {
                    handleItemsPerPageChange(Number(e.target.value));
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                <div className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-wider">
                  {startItem}-{endItem} <span className="mx-1">of</span> {filteredTickets.length}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    setPageInput(String(newPage));
                  }}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-transparent hover:border-white/60"
                >
                  <Icons.ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-white/50 border border-white/60 rounded-xl shadow-sm">
                  <input
                    type="text"
                    value={pageInput}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    onBlur={handlePageInputBlur}
                    className="w-8 text-center bg-transparent text-sm font-bold text-blue-600 focus:outline-none"
                  />
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest border-l border-white/60 pl-2">
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
                  className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-transparent hover:border-white/60"
                >
                  <Icons.ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TicketDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

