'use client';

import { motion } from 'framer-motion';

interface NavigationProps {
  activeTab: 'submit' | 'check';
  onTabChange: (tab: 'submit' | 'check') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="flex gap-2 flex-wrap">
      <button
        onClick={() => onTabChange('submit')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          activeTab === 'submit'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-transparent text-blue-600 border border-gray-300 hover:bg-blue-50'
        }`}
      >
        Submit Ticket
      </button>
      <button
        onClick={() => onTabChange('check')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          activeTab === 'check'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-transparent text-blue-600 border border-gray-300 hover:bg-blue-50'
        }`}
      >
        Check Ticket
      </button>
    </nav>
  );
}

