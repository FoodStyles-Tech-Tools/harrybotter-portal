'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AppHeaderProps {
  userName?: string;
  userImage?: string | null;
}

// Inline SVGs for lightweight icons
const Icons = {
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  List: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  ),
  Logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
};

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
    { href: '/chat', label: 'Chat', icon: Icons.Chat },
    { href: '/tickets', label: 'Ticket', icon: Icons.List },
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
    <header className="sticky top-0 z-40 glass-panel border-b border-white/20 transition-all duration-300">
      <div className="w-full px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-10">
          {/* Main Title / Brand */}
          <Link href="/chat" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)]">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                HarryBotter
              </span>
              <span className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider mt-0.5">
                Portal
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/30 p-1 rounded-2xl border border-white/20">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/submit-ticket' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-[1.01]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-semibold bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-wider"
          >
            <Icons.Plus className="w-4 h-4" strokeWidth={3} />
            Create
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 pl-6 border-l border-gray-200/30">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Account</p>
              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{userName ?? 'User'}</p>
            </div>
            
            {userImage ? (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                <Image
                  src={userImage}
                  alt={userName ?? 'User avatar'}
                  width={40}
                  height={40}
                  className="relative rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full glass-button text-blue-600 flex items-center justify-center text-sm font-semibold shadow-sm">
                {initials}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 p-2.5 rounded-xl glass-button text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 hover:border-rose-100 transition-all group"
              title="Logout"
            >
              <Icons.Logout className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
