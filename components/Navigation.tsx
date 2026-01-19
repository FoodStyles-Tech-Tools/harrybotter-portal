import Link from 'next/link';

interface NavigationProps {
  activeTab: 'assistant' | 'submit' | 'check';
}

export default function Navigation({ activeTab }: NavigationProps) {
  const baseClasses =
    'px-4 py-2 text-sm font-medium rounded-2xl transition-all duration-200 border';

  return (
    <nav className="flex gap-2 flex-wrap">
      <Link
        href="/chat"
        className={`${baseClasses} ${
          activeTab === 'assistant'
            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)]'
            : 'bg-white/50 border-white/60 text-blue-600 hover:bg-white/80'
        }`}
      >
        TechTool Assistant
      </Link>
      <Link
        href="/submit-ticket"
        className={`${baseClasses} ${
          activeTab === 'submit'
            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)]'
            : 'bg-white/50 border-white/60 text-blue-600 hover:bg-white/80'
        }`}
      >
        Submit Ticket
      </Link>
      <Link
        href="/check-ticket"
        className={`${baseClasses} ${
          activeTab === 'check'
            ? 'bg-blue-600 border-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.2)]'
            : 'bg-white/50 border-white/60 text-blue-600 hover:bg-white/80'
        }`}
      >
        Check Ticket
      </Link>
    </nav>
  );
}

