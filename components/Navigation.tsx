import Link from 'next/link';

interface NavigationProps {
  activeTab: 'submit' | 'check';
}

export default function Navigation({ activeTab }: NavigationProps) {
  const baseClasses =
    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border';

  return (
    <nav className="flex gap-2 flex-wrap">
      <Link
        href="/submit-ticket"
        className={`${baseClasses} ${
          activeTab === 'submit'
            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
            : 'bg-transparent border-gray-300 text-blue-600 hover:bg-blue-50'
        }`}
      >
        Submit Ticket
      </Link>
      <Link
        href="/check-ticket"
        className={`${baseClasses} ${
          activeTab === 'check'
            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
            : 'bg-transparent border-gray-300 text-blue-600 hover:bg-blue-50'
        }`}
      >
        Check Ticket
      </Link>
    </nav>
  );
}

