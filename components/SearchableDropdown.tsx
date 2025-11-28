'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function SearchableDropdown({
  options,
  placeholder = 'Search...',
  value,
  onSelect,
  allowClear = false,
  isLoading = false,
  className = '',
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
      <div className="relative">
        <div className="relative flex items-center">
          {allowClear && selectedOption && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
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
            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isLoading ? 'bg-gray-100 animate-pulse' : 'bg-white'
            } ${allowClear && selectedOption ? 'pr-8' : ''}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {filteredOptions.map((option, index) => (
              <div
                key={option.id || option.name}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-3 ${
                  highlightedIndex === index
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {option.avatar_url && !(failedAvatars[String(option.id ?? option.name)] ?? false) ? (
                  <Image
                    src={option.avatar_url}
                    alt={option.name}
                    width={32}
                    height={32}
                    unoptimized
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(event) => {
                      const key = String(option.id ?? option.name);
                      setFailedAvatars((prev) => ({ ...prev, [key]: true }));
                      const target = event.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                    {option.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{option.name}</div>
                  {option.email && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{option.email}</div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

