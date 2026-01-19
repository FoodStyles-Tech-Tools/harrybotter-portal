'use client';
import type { Ticket } from '@/types';

interface TicketDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketDrawer({ ticket, isOpen, onClose }: TicketDrawerProps) {
  if (!ticket) return null;

  const dueDate = ticket.dueDate || ticket.due_date || null;
  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <>
      {isOpen && (
        <>
          <div
            onClick={onClose}
            className="fixed inset-0 bg-blue-900/10 backdrop-blur-sm z-40 transition-all duration-300"
          />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white/70 backdrop-blur-2xl border-l border-white/60 shadow-2xl z-50 flex flex-col font-outfit"
          >
            <div className="flex items-center justify-between p-8 border-b border-white/60 bg-white/40">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md self-start border border-blue-100 uppercase tracking-widest">
                  {ticket.display_id || (ticket.id.startsWith('HRB-') ? ticket.id : `HRB-${ticket.id}`)}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
                  {ticket.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="bg-white/40 rounded-2xl p-5 border border-white/60 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/40 rounded-2xl p-5 border border-white/60 shadow-sm">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Created</h3>
                   <p className="text-sm font-semibold text-gray-900">{formatDateTime(ticket.created_at)}</p>
                </div>
                {dueDate && (
                  <div className="bg-white/40 rounded-2xl p-5 border border-white/60 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deadline</h3>
                    <p className="text-sm font-semibold text-blue-600">{formatDateTime(dueDate)}</p>
                  </div>
                )}
              </div>

              {ticket.status === 'Cancelled' && (() => {
                let cancellationReason: string | null = null;
                if (ticket.meta) {
                  if (typeof ticket.meta === 'object') {
                    cancellationReason = ticket.meta.cancellation_reason || ticket.meta.reason || ticket.meta.cancellationReason || null;
                  } else if (typeof ticket.meta === 'string') {
                    try {
                      const metaParsed = JSON.parse(ticket.meta);
                      cancellationReason = metaParsed.cancellation_reason || metaParsed.reason || metaParsed.cancellationReason || null;
                    } catch {
                      cancellationReason = ticket.meta;
                    }
                  }
                }
                return cancellationReason ? (
                  <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 shadow-sm">
                    <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">Cancellation Reason</h3>
                    <p className="text-sm text-rose-700 whitespace-pre-wrap">{cancellationReason}</p>
                  </div>
                ) : null;
              })()}

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Timeline Details</h3>
                <div className="bg-white/40 rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                  {ticket.assigned_at && (
                    <div className="flex items-center justify-between p-4 border-b border-white/40 last:border-0 hover:bg-white/50 transition-all">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Assigned At</span>
                      <span className="text-xs font-semibold text-gray-900">{formatDateTime(ticket.assigned_at)}</span>
                    </div>
                  )}
                  {ticket.completed_at && (
                    <div className="flex items-center justify-between p-4 border-b border-white/40 last:border-0 hover:bg-white/50 transition-all">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Completed At</span>
                      <span className="text-xs font-semibold text-emerald-600">{formatDateTime(ticket.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {ticket.relevantLink && (
                <div className="bg-white/40 rounded-2xl p-5 border border-white/60 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {ticket.relevantLink.split('\n').map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-800 underline truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

