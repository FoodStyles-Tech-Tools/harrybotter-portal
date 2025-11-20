'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import TicketDrawer from './TicketDrawer';
import type { Ticket } from '@/types';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Open: { bg: 'bg-gray-100', text: 'text-gray-700' },
  'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Completed: { bg: 'bg-green-100', text: 'text-green-800' },
  Cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  'On Hold': { bg: 'bg-gray-800', text: 'text-gray-100' },
  Blocked: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Request: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Bug: { bg: 'bg-red-100', text: 'text-red-800' },
  Task: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

interface TicketListProps {
  initialTickets?: Ticket[];
  initialProjects?: Array<{ id: number; name: string }>;
  initialTicketIdFilter?: string | null;
  onRefresh?: () => void;
}

export default function TicketList({ initialTickets = [], initialProjects = [], initialTicketIdFilter, onRefresh }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [isLoading, setIsLoading] = useState(!initialTickets.length);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);

  // Filters
  const [ticketIdFilter, setTicketIdFilter] = useState(initialTicketIdFilter || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [requesterFilter, setRequesterFilter] = useState<DropdownOption | null>(null);
  const [projectFilter, setProjectFilter] = useState<DropdownOption | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage, setTicketsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    if (!initialTickets.length) {
      const loadTickets = async () => {
        try {
          const response = await fetch('/api/tickets');
          const data = await response.json();
          if (data.error) {
            console.error(data.error);
          } else {
            setTickets(data);
          }
        } catch (error) {
          console.error('Failed to load tickets:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadTickets();
    } else {
      setIsLoading(false);
    }
  }, [initialTickets]);

  // Update ticket ID filter when initialTicketIdFilter changes
  useEffect(() => {
    if (initialTicketIdFilter) {
      setTicketIdFilter(initialTicketIdFilter);
    }
  }, [initialTicketIdFilter]);

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
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ticket ID</label>
            <input
              type="text"
              value={ticketIdFilter}
              onChange={(e) => {
                setTicketIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="HRB-123..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search Title</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Requester</label>
            <SearchableDropdown
              options={requesters}
              placeholder="Filter by requester..."
              value={requesterFilter?.id}
              onSelect={(option) => {
                setRequesterFilter(option);
                setCurrentPage(1);
              }}
              allowClear
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project</label>
            <SearchableDropdown
              options={projectOptions}
              placeholder="Filter by project..."
              value={projectFilter?.id}
              onSelect={(option) => {
                setProjectFilter(option);
                setCurrentPage(1);
              }}
              allowClear
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.keys(TYPE_COLORS).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* Table */}
        <div 
          data-table-container
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                <col style={{ width: '8%' }} /> {/* ID */}
                <col style={{ width: '25%' }} /> {/* Title */}
                <col style={{ width: '10%' }} /> {/* Project */}
                <col style={{ width: '10%' }} /> {/* Requester */}
                <col style={{ width: '10%' }} /> {/* Assignee */}
                <col style={{ width: '8%' }} /> {/* Type */}
                <col style={{ width: '8%' }} /> {/* Priority */}
                <col style={{ width: '10%' }} /> {/* Status */}
                <col style={{ width: '11%' }} /> {/* Created At */}
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence mode="wait">
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No tickets found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket) => {
                      const attachmentUrls = ticket.relevantLink
                        ? ticket.relevantLink.split('\n').filter((url) => url.trim())
                        : [];

                      return (
                        <motion.tr
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => handleTicketClick(ticket)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 py-3 text-sm font-medium text-gray-900 break-words">
                            <div className="flex items-center gap-2">
                              <span className="break-words">
                                {ticket.display_id || (ticket.id.startsWith('HRB-') ? ticket.id : `HRB-${ticket.id}`)}
                              </span>
                              <button
                                onClick={(e) => handleCopyToClipboard(ticket, e)}
                                className={`transition-all p-1 rounded ${
                                  copiedTicketId === ticket.id
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title={copiedTicketId === ticket.id ? 'Copied!' : 'Copy ID - Title'}
                                type="button"
                              >
                                {copiedTicketId === ticket.id ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900">
                            <div className="space-y-1">
                              <div className="font-medium break-words">
                                {highlightText(ticket.title, searchFilter)}
                              </div>
                              {ticket.description && (
                                <div className="text-xs text-gray-500 line-clamp-2 break-words">
                                  {ticket.description}
                                </div>
                              )}
                              {attachmentUrls.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {attachmentUrls.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                        />
                                      </svg>
                                      <span className="truncate max-w-[200px]">{url}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 break-words">
                            {ticket.projectName || 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 break-words">{ticket.requestedBy}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 break-words">
                            {ticket.assignee || 'Unassigned'}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                TYPE_COLORS[ticket.type]?.bg || 'bg-gray-100'
                              } ${TYPE_COLORS[ticket.type]?.text || 'text-gray-700'}`}
                            >
                              {ticket.type}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 break-words">{ticket.priority}</td>
                          <td className="px-3 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                STATUS_COLORS[ticket.status]?.bg || 'bg-gray-100'
                              } ${STATUS_COLORS[ticket.status]?.text || 'text-gray-700'}`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 break-words">
                            {(() => {
                              const { formatted, relative } = formatDate(ticket.createdAt);
                              return (
                                <div className="space-y-0.5">
                                  <div className="break-words">{formatted}</div>
                                  {relative && (
                                    <div className="text-xs text-gray-400 break-words">{relative}</div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {/* Left side - Items per page */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Items per page</label>
                <select
                  value={ticketsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                {startItem} - {endItem} of {filteredTickets.length} items
              </div>
            </div>

            {/* Right side - Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setPageInput('1');
                }}
                disabled={currentPage === 1}
                className="p-1.5 text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-blue-50 rounded transition-colors"
                title="First page"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  setPageInput(String(newPage));
                }}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-blue-50 rounded transition-colors"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Page</span>
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => handlePageInputChange(e.target.value)}
                  onBlur={handlePageInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePageInputBlur();
                    }
                  }}
                  className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>
              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                  setPageInput(String(newPage));
                }}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-blue-50 rounded transition-colors"
                type="button"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setCurrentPage(totalPages);
                  setPageInput(String(totalPages));
                }}
                disabled={currentPage === totalPages}
                className="p-1.5 text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-blue-50 rounded transition-colors"
                title="Last page"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <TicketDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

