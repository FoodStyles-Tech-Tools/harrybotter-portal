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
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
          />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {ticket.display_id || (ticket.id.startsWith('HRB-') ? ticket.id : `HRB-${ticket.id}`)}: {ticket.title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Created At</h3>
                <p className="text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</p>
              </div>
              {dueDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Expected Done Date</h3>
                  <p className="text-sm text-gray-900">{formatDateTime(dueDate)}</p>
                </div>
              )}
              {ticket.assignedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned At</h3>
                  <p className="text-sm text-gray-900">{formatDateTime(ticket.assignedAt)}</p>
                </div>
              )}
              {ticket.completedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Completed At</h3>
                  <p className="text-sm text-gray-900">{formatDateTime(ticket.completedAt)}</p>
                </div>
              )}
              {ticket.status === 'Cancelled' && (() => {
                // Try to get cancellation reason from meta field
                let cancellationReason: string | null = null;
                if (ticket.meta) {
                  if (typeof ticket.meta === 'object') {
                    cancellationReason = ticket.meta.cancellation_reason || ticket.meta.reason || ticket.meta.cancellationReason || null;
                  } else if (typeof ticket.meta === 'string') {
                    try {
                      const metaParsed = JSON.parse(ticket.meta);
                      cancellationReason = metaParsed.cancellation_reason || metaParsed.reason || metaParsed.cancellationReason || null;
                    } catch {
                      // If parsing fails, treat meta as the reason itself
                      cancellationReason = ticket.meta;
                    }
                  }
                }
                return cancellationReason ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Cancellation Reason</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{cancellationReason}</p>
                  </div>
                ) : null;
              })()}
              {ticket.relevantLink && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
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

