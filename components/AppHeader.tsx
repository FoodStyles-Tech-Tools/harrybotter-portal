'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  Archive: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M4 8v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [userImageError, setUserImageError] = useState(false);

  useEffect(() => {
    if (!isShortcutsOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isShortcutsOpen]);

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
    { href: '/assets', label: 'Assets', icon: Icons.Archive },
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
    <header className="sticky top-0 z-40 glass-panel border-b border-white/30">
      <div className="w-full px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          {/* Main Title / Brand */}
          <Link href="/chat" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)] transition-transform duration-300 group-hover:scale-105">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                HarryBotter
              </span>
              <span className="text-[10px] font-semibold text-blue-500/70 uppercase tracking-[0.2em] mt-0.5">
                Portal
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/50 p-1.5 rounded-2xl border border-white/40">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/80 text-blue-600 shadow-[0_6px_16px_rgba(37,99,235,0.12)] scale-[1.01]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium transition-all duration-300 text-slate-500 hover:text-slate-900 hover:bg-white/60"
            >
              <Icons.Plus className="w-4 h-4 text-slate-400" strokeWidth={2} />
              Create
            </button>
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 pl-6 border-l border-white/40">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-0.5">Account</p>
              <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">{userName ?? 'User'}</p>
            </div>
            
            {userImage && !userImageError ? (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-blue-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                <Image
                  src={userImage}
                  alt={userName ?? 'User avatar'}
                  width={40}
                  height={40}
                  className="relative rounded-full object-cover ring-2 ring-white/80 shadow-sm"
                  onError={() => setUserImageError(true)}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full glass-button text-blue-600 flex items-center justify-center text-sm font-semibold shadow-sm">
                {initials}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2.5 rounded-xl glass-button text-slate-400 hover:text-blue-600 transition-all"
              title="Keyboard shortcuts"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 p-2.5 rounded-xl glass-button text-slate-400 hover:text-rose-500 hover:bg-white/70 hover:border-rose-200 transition-all group"
              title="Logout"
            >
              <Icons.Logout className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {isShortcutsOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-blue-900/30"
            onClick={() => setIsShortcutsOpen(false)}
          />
          <div className="relative w-full max-w-md glass-panel bg-white rounded-[1.75rem] border border-white/70 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.45)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/60">
              <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Keyboard Shortcuts
              </span>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="ml-auto text-slate-400 hover:text-slate-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-5 space-y-3 text-[12px] text-slate-600 font-normal">
              <div className="flex items-center justify-between">
                <span>New chat (Chat page)</span>
                <div className="flex items-center gap-1">
                  <kbd className="inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-normal text-slate-600 shadow-sm">Alt</kbd>
                  <kbd className="inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-normal text-slate-600 shadow-sm">N</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>New chat (Mac)</span>
                <div className="flex items-center gap-1">
                  <kbd className="inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-normal text-slate-600 shadow-sm">⌥</kbd>
                  <kbd className="inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-normal text-slate-600 shadow-sm">N</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Search tickets</span>
                <kbd className="inline-flex h-6 items-center rounded-md border border-white/70 bg-white/80 px-2 text-[10px] font-normal text-slate-600 shadow-sm">/</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
