'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search conversations..." }: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} transition-all duration-150 rounded-lg`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-8 py-2.5 bg-surface border border-subtle rounded-lg text-sm placeholder-text-muted focus:outline-none focus:border-blue-500 transition-custom"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-gray-700 transition-custom"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}