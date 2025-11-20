'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Ticket } from '@/types';

interface TicketDrawerProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketDrawer({ ticket, isOpen, onClose }: TicketDrawerProps) {
  if (!ticket) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
                <p className="text-sm text-gray-900">{ticket.createdAt || '-'}</p>
              </div>
              {ticket.assignedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned At</h3>
                  <p className="text-sm text-gray-900">{ticket.assignedAt}</p>
                </div>
              )}
              {ticket.completedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Completed At</h3>
                  <p className="text-sm text-gray-900">{ticket.completedAt}</p>
                </div>
              )}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

