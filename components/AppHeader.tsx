'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AppHeaderProps {
  userName?: string;
  userImage?: string | null;
}

export default function AppHeader({ userName, userImage }: AppHeaderProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const navItems = [
    { href: '/submit-ticket', label: 'Submit Ticket' },
    { href: '/check-ticket', label: 'Check Ticket' },
  ];

  const initials = userName
    ? userName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="w-full px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-lg font-semibold text-gray-900">TechTool Ticketing Portal</div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/submit-ticket' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName ?? 'User avatar'}
              width={40}
              height={40}
              className="rounded-full object-cover border border-blue-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          )}
          <div className="text-left">
            <p className="text-xs text-gray-500 leading-none">Logged in as</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{userName ?? 'User'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
