import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  searchFunction?: (query: string) => Option[] | Promise<Option[]>;
  popularOptions?: Option[];
}

export function SearchableSelect({ 
  id, 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Type to search...", 
  error, 
  required = false,
  searchFunction,
  popularOptions
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle async search
  useEffect(() => {
    const performSearch = async () => {
      // Don't open dropdown if user has already selected a value and searchTerm matches it
      const selectedOption = options.find(option => option.value === value);
      if (selectedOption && searchTerm === selectedOption.label) {
        setIsOpen(false);
        setFilteredOptions([]);
        return;
      }

      if (searchFunction && searchTerm.trim()) {
        setIsOpen(true); // Open dropdown when starting to search
        setIsSearching(true);
        try {
          const results = await Promise.resolve(searchFunction(searchTerm));
          setFilteredOptions(results);
        } catch (error) {
          console.warn('Search function error:', error);
          setFilteredOptions([]);
        } finally {
          setIsSearching(false);
        }
      } else if (searchTerm.trim()) {
        setIsOpen(true); // Open dropdown when starting to search
        // Fallback to local filtering
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        // Close dropdown when search is empty
        setIsOpen(false);
        setFilteredOptions([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchFunction, options, popularOptions, value]);

  // Update display value when value prop changes
  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setDisplayValue(selectedOption ? selectedOption.label : '');
    setSearchTerm(selectedOption ? selectedOption.label : '');
  }, [value, options]);

  // Initialize filtered options (but don't show dropdown)
  useEffect(() => {
    setFilteredOptions([]);
    setIsOpen(false);
  }, [options, popularOptions]);

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(false); // Don't open dropdown immediately
    setSearchTerm('');
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    
    // If the input exactly matches an option, select it
    const exactMatch = options.find(option => 
      option.label.toLowerCase() === newSearchTerm.toLowerCase()
    );
    if (exactMatch) {
      onChange(exactMatch.value);
    } else if (newSearchTerm === '') {
      onChange('');
    }
  };

  // Handle option selection
  const handleOptionClick = (option: Option) => {
    onChange(option.value);
    setDisplayValue(option.label);
    setSearchTerm(option.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle blur (close dropdown)
  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within our component
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return; // Don't close if clicking on dropdown
    }
    
    setTimeout(() => {
      setIsOpen(false);
      // Reset to display value if search didn't match anything
      const selectedOption = options.find(option => option.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      } else if (searchTerm && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase())) {
        setSearchTerm('');
      }
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="mb-4 relative">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent ${
            error ? 'border-red-400' : 'border-white/30'
          }`}
          autoComplete="off"
        />
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-lg border border-white/30 rounded-md shadow-xl"
          >
            {isSearching ? (
              <div className="px-3 py-2 text-gray-500 text-sm flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Searching...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className="w-full px-3 py-2 text-left text-gray-800 hover:bg-white/80 focus:bg-white/80 focus:outline-none transition-colors"
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {searchTerm.trim() 
                  ? `No results found for "${searchTerm}". Try a different search term.`
                  : "Start typing to search..."
                }
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-400" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
}