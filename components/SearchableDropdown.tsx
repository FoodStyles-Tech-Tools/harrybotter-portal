'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  id?: number | string;
  name: string;
  email?: string;
  avatar_url?: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  placeholder?: string;
  value?: string | number;
  onSelect: (option: DropdownOption | null) => void;
  allowClear?: boolean;
  isLoading?: boolean;
  className?: string;
  showAvatar?: boolean;
}

export default function SearchableDropdown({
  options,
  placeholder = 'Search...',
  value,
  onSelect,
  allowClear = false,
  isLoading = false,
  className = '',
  showAvatar = true,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  const selectedOption = options.find((opt) => String(opt.id || opt.name) === String(value));
  const selectedKey = selectedOption ? String(selectedOption.id ?? selectedOption.name) : undefined;

  const filteredOptions = options.filter((option) => {
    const search = searchTerm.toLowerCase();
    return (
      option.name.toLowerCase().includes(search) ||
      (option.email && option.email.toLowerCase().includes(search))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'Enter' || e.key === 'ArrowDown')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative group">
        <div className="relative flex items-center">
          {allowClear && selectedOption && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : selectedOption?.name || ''}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Loading...' : placeholder}
            disabled={isLoading}
            className={`w-full h-11 px-4 text-sm glass-input rounded-xl font-normal transition-all duration-300 placeholder:text-slate-300 ${
              isLoading ? 'opacity-50 pointer-events-none' : ''
            } ${allowClear && selectedOption ? 'pr-14' : 'pr-10'}`}
          />
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 text-blue-500 ${isOpen ? 'rotate-180' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute z-[100] w-full mt-2 glass-panel rounded-2xl shadow-[0_24px_60px_-45px_rgba(37,99,235,0.4)] max-h-60 overflow-y-auto overflow-x-hidden p-1 animate-in fade-in slide-in-from-top-2 duration-200 bg-white/85"
          style={{ transformOrigin: 'top' }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || option.name}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3 py-2.5 cursor-pointer rounded-xl transition-all duration-200 flex items-center gap-3 mb-0.5 last:mb-0 ${
                  highlightedIndex === index
                    ? 'bg-blue-600/95 text-white shadow-md scale-[1.02] z-10'
                    : 'bg-white/80 text-slate-800 hover:bg-white hover:text-slate-900 shadow-sm'
                }`}
              >
                {showAvatar && (
                  option.avatar_url && !(failedAvatars[String(option.id ?? option.name)] ?? false) ? (
                    <div className={`relative flex-shrink-0 ${highlightedIndex === index ? 'ring-2 ring-white/30' : ''} rounded-full`}>
                      <Image
                        src={option.avatar_url}
                        alt={option.name}
                        width={28}
                        height={28}
                        unoptimized
                        className="w-7 h-7 rounded-full object-cover"
                        onError={() => {
                          const key = String(option.id ?? option.name);
                          setFailedAvatars((prev) => ({ ...prev, [key]: true }));
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                      highlightedIndex === index 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {option.name.charAt(0).toUpperCase()}
                    </div>
                  )
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-normal truncate leading-tight">{option.name}</div>
                  {option.email && (
                    <div className={`text-[10px] truncate mt-0.5 ${highlightedIndex === index ? 'text-white/70' : 'text-slate-500'}`}>
                      {option.email}
                    </div>
                  )}
                </div>
                {String(option.id || option.name) === String(value) && (
                  <div className={highlightedIndex === index ? 'text-white' : 'text-blue-600'}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

