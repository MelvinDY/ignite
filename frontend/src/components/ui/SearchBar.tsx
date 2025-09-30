import { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { searchApi, type LookupOption, type SearchFilters } from '../../lib/api/search';

interface SearchBarProps {
  query?: string;
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 250) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

const SearchBar = ({ query, onSearch, onClear }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(query || '');
  const [showFilters, setShowFilters] = useState(false);

  // Lookup options
  const [majors, setMajors] = useState<LookupOption[]>([]);
  const [companies, setCompanies] = useState<LookupOption[]>([]);
  const [workFields, setWorkFields] = useState<LookupOption[]>([]);
  const [cities, setCities] = useState<LookupOption[]>([]);

  // Selected filters (store IDs from options)
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedWorkFields, setSelectedWorkFields] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCitizenship, setSelectedCitizenship] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Citizenship — set ids equal to names so mapping stays simple
  const citizenshipOptions: LookupOption[] = [
    { id: 'Citizen', name: 'Citizen' },
    { id: 'Permanent Resident', name: 'Permanent Resident' },
  ];

  // Companies server-autocomplete query
  const [companiesQuery, setCompaniesQuery] = useState('');

  // Load lookup data (majors, work fields, cities, base companies) when panel opens
  const loadLookupData = useCallback(async () => {
    try {
      const [majorsData, companiesData, workFieldsData, citiesData] = await Promise.all([
        majors.length ? Promise.resolve(majors) : searchApi.getMajors(),
        // Start companies with a baseline list (no query)
        companies.length ? Promise.resolve(companies) : searchApi.getCompanies(),
        workFields.length ? Promise.resolve(workFields) : searchApi.getWorkFields(),
        cities.length ? Promise.resolve(cities) : searchApi.getCities(),
      ]);
      if (majors.length === 0) setMajors(majorsData);
      if (companies.length === 0) setCompanies(companiesData);
      if (workFields.length === 0) setWorkFields(workFieldsData);
      if (cities.length === 0) setCities(citiesData);
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    }
  }, [majors, companies, workFields, cities]);

  useEffect(() => {
    if (showFilters) {
      loadLookupData();
    }
  }, [showFilters, loadLookupData]);

  // Debounced fetch for companies when typing inside the Companies multiselect
  const debouncedFetchCompanies = useCallback(
    debounce(async (q: string) => {
      try {
        const data = await searchApi.getCompanies(q || undefined);
        setCompanies(data);
      } catch (e) {
        console.error('Failed to fetch companies', e);
      }
    }, 250),
    []
  );

  useEffect(() => {
    if (showFilters) {
      debouncedFetchCompanies(companiesQuery);
    }
  }, [companiesQuery, showFilters, debouncedFetchCompanies]);

  const handleSearch = useCallback(() => {
    const trimmed = searchTerm.trim();

    const hasSearchCriteria =
      !!trimmed ||
      selectedMajors.length > 0 ||
      selectedCompanies.length > 0 ||
      selectedWorkFields.length > 0 ||
      selectedCities.length > 0 ||
      selectedCitizenship.length > 0;

    if (!hasSearchCriteria) return;

    // Convert selected IDs -> names
    const majorNames = selectedMajors
      .map((id) => majors.find((m) => m.id === id)?.name)
      .filter(Boolean) as string[];

    const companyNames = selectedCompanies
      .map((id) => companies.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const workFieldNames = selectedWorkFields
      .map((id) => workFields.find((w) => w.id === id)?.name)
      .filter(Boolean) as string[];

    const cityNames = selectedCities
      .map((id) => cities.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    // Citizenship already uses ids equal to names
    const citizenshipNames = selectedCitizenship;

    const filters: SearchFilters = {
      q: trimmed || undefined,
      majors: majorNames.length ? majorNames : undefined,
      companies: companyNames.length ? companyNames : undefined,
      workFields: workFieldNames.length ? workFieldNames : undefined,
      cities: cityNames.length ? cityNames : undefined,
      citizenship: citizenshipNames.length ? citizenshipNames : undefined,
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      page: 1,
      pageSize: 20,
    };

    onSearch(filters);
  }, [
    searchTerm,
    selectedMajors,
    selectedCompanies,
    selectedWorkFields,
    selectedCities,
    selectedCitizenship,
    sortBy,
    onSearch,
    majors,
    companies,
    workFields,
    cities,
  ]);

  const handleClear = () => {
    setSearchTerm('');
    setSelectedMajors([]);
    setSelectedCompanies([]);
    setSelectedWorkFields([]);
    setSelectedCities([]);
    setSelectedCitizenship([]);
    setSortBy('relevance');
    setShowFilters(false);
    setCompaniesQuery('');
    onClear?.();
  };

  const hasActiveFilters =
    selectedMajors.length > 0 ||
    selectedCompanies.length > 0 ||
    selectedWorkFields.length > 0 ||
    selectedCities.length > 0 ||
    selectedCitizenship.length > 0;

  type MultiSelectProps = {
    options: LookupOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    onQueryChange?: (q: string) => void; // used for Companies only
  };

  const MultiSelect = ({
    options,
    selected,
    onChange,
    placeholder,
    onQueryChange,
  }: MultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localQuery, setLocalQuery] = useState('');

    const toggleOption = (optionId: string) => {
      if (selected.includes(optionId)) {
        onChange(selected.filter((id) => id !== optionId));
      } else {
        onChange([...selected, optionId]);
      }
    };

    const filteredOptions = options.filter((option) =>
      (option?.name || '').toLowerCase().includes(localQuery.toLowerCase())
    );

    const selectedNames = options
      .filter((option) => selected.includes(option.id))
      .map((option) => option.name);

    return (
      <div className="relative">
        <div
          className="w-full min-h-[40px] p-2 border border-gray-300 rounded-md bg-white cursor-text"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedNames.map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const optionToRemove = options.find((opt) => opt.name === name);
                    if (optionToRemove) toggleOption(optionToRemove.id);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder={selected.length > 0 ? 'Type to add more...' : placeholder}
            value={localQuery}
            onChange={(e) => {
              const q = e.target.value;
              setLocalQuery(q);
              onQueryChange?.(q);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full outline-none text-sm text-gray-900 bg-transparent"
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-900">{option.name}</span>
                </label>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500">
                No options found for &quot;{localQuery}&quot;
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setLocalQuery('');
              onQueryChange?.(''); // reset companies query when closing
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            className="w-full h-10 px-4 pr-10 rounded-full border border-gray-300 bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search people..."
            autoComplete="off"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`p-2 rounded-full transition-colors ${
            hasActiveFilters || showFilters
              ? 'text-[#fbbf39] bg-yellow-50'
              : 'text-white hover:text-[#fbbf39]'
          }`}
          aria-label="Toggle filters"
        >
          <Filter className="w-5 h-5" />
        </button>

        <button
          onClick={handleSearch}
          className="text-white hover:text-[#fbbf39] transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-40">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Majors
              </label>
              <MultiSelect
                options={majors}
                selected={selectedMajors}
                onChange={setSelectedMajors}
                placeholder="Type to filter majors (e.g., Electrical Engineering)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Companies
              </label>
              <MultiSelect
                options={companies}
                selected={selectedCompanies}
                onChange={setSelectedCompanies}
                placeholder="Type to search companies"
                onQueryChange={setCompaniesQuery} // enables server autocomplete
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Fields
              </label>
              <MultiSelect
                options={workFields}
                selected={selectedWorkFields}
                onChange={setSelectedWorkFields}
                placeholder="Type to filter work fields"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cities
              </label>
              <MultiSelect
                options={cities}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Type to filter cities"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizenship
              </label>
              <MultiSelect
                options={citizenshipOptions}
                selected={selectedCitizenship}
                onChange={setSelectedCitizenship}
                placeholder="Select citizenship status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 bg-[#7C0B2B] text-white px-4 py-2 rounded-md hover:bg-[#7C0B2B]/90"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-900"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
