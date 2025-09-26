import { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { searchApi, type LookupOption, type SearchFilters } from '../../lib/api/search';

interface SearchBarProps {
  query?: string;
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
}

const SearchBar = ({ query, onSearch, onClear }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(query || '');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [majors, setMajors] = useState<LookupOption[]>([]);
  const [companies, setCompanies] = useState<LookupOption[]>([]);
  const [workFields, setWorkFields] = useState<LookupOption[]>([]);
  const [cities, setCities] = useState<LookupOption[]>([]);

  // Selected filters
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedWorkFields, setSelectedWorkFields] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCitizenship, setSelectedCitizenship] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  const citizenshipOptions = [
    { id: 'citizen', name: 'Citizen' },
    { id: 'permanent-resident', name: 'Permanent Resident' }
  ];

  // Load lookup data when filters are first opened
  const loadLookupData = async () => {
    if (majors.length > 0) return; // Already loaded

    try {
      const [majorsData, companiesData, workFieldsData, citiesData] = await Promise.all([
        searchApi.getMajors(),
        searchApi.getCompanies(),
        searchApi.getWorkFields(),
        searchApi.getCities()
      ]);
      setMajors(majorsData);
      setCompanies(companiesData);
      setWorkFields(workFieldsData);
      setCities(citiesData);
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    }
  };

  const handleSearch = useCallback(() => {
    const trimmedSearchTerm = searchTerm.trim();

    // Check if at least one search criterion is provided
    const hasSearchCriteria = trimmedSearchTerm ||
                              selectedMajors.length > 0 ||
                              selectedCompanies.length > 0 ||
                              selectedWorkFields.length > 0 ||
                              selectedCities.length > 0 ||
                              selectedCitizenship.length > 0;

    if (!hasSearchCriteria) {
      // Don't perform search if no criteria are provided
      return;
    }

    // Convert IDs to names for the backend
    const majorNames = selectedMajors.map(id =>
      majors.find(m => m.id === id)?.name
    ).filter(Boolean) as string[];

    const companyNames = selectedCompanies.map(id =>
      companies.find(c => c.id === id)?.name
    ).filter(Boolean) as string[];

    const workFieldNames = selectedWorkFields.map(id =>
      workFields.find(w => w.id === id)?.name
    ).filter(Boolean) as string[];

    const cityNames = selectedCities.map(id =>
      cities.find(c => c.id === id)?.name
    ).filter(Boolean) as string[];

    const filters: SearchFilters = {
      q: trimmedSearchTerm || undefined,
      majors: majorNames.length ? majorNames : undefined,
      companies: companyNames.length ? companyNames : undefined,
      workFields: workFieldNames.length ? workFieldNames : undefined,
      cities: cityNames.length ? cityNames : undefined,
      citizenship: selectedCitizenship.length ? selectedCitizenship : undefined,
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      page: 1,
      pageSize: 20
    };
    onSearch(filters);
  }, [searchTerm, selectedMajors, selectedCompanies, selectedWorkFields, selectedCities, selectedCitizenship, sortBy, onSearch, majors, companies, workFields, cities]);

  const handleClear = () => {
    setSearchTerm('');
    setSelectedMajors([]);
    setSelectedCompanies([]);
    setSelectedWorkFields([]);
    setSelectedCities([]);
    setSelectedCitizenship([]);
    setSortBy('relevance');
    setShowFilters(false);
    onClear?.();
  };

  const hasActiveFilters = selectedMajors.length > 0 || selectedCompanies.length > 0 ||
    selectedWorkFields.length > 0 || selectedCities.length > 0 || selectedCitizenship.length > 0;

  const MultiSelect = ({
    options,
    selected,
    onChange,
    placeholder
  }: {
    options: LookupOption[];
    selected: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleOption = (optionId: string) => {
      if (selected.includes(optionId)) {
        onChange(selected.filter(id => id !== optionId));
      } else {
        onChange([...selected, optionId]);
      }
    };

    const filteredOptions = options.filter(option =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedNames = options
      .filter(option => selected.includes(option.id))
      .map(option => option.name);

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
                    const optionToRemove = options.find(opt => opt.name === name);
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
            placeholder={selected.length > 0 ? "Type to add more..." : placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full outline-none text-sm text-gray-900 bg-transparent"
          />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <label key={option.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
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
                No options found for "{searchTerm}"
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
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
          onClick={async () => {
            if (!showFilters) {
              await loadLookupData();
            }
            setShowFilters(!showFilters);
          }}
          className={`p-2 rounded-full transition-colors ${
            hasActiveFilters || showFilters
              ? 'text-[#fbbf39] bg-yellow-50'
              : 'text-white hover:text-[#fbbf39]'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>

        <button
          onClick={handleSearch}
          className="text-white hover:text-[#fbbf39] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-40">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Majors</label>
              <MultiSelect
                options={majors}
                selected={selectedMajors}
                onChange={setSelectedMajors}
                placeholder="Select majors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Companies</label>
              <MultiSelect
                options={companies}
                selected={selectedCompanies}
                onChange={setSelectedCompanies}
                placeholder="Select companies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Fields</label>
              <MultiSelect
                options={workFields}
                selected={selectedWorkFields}
                onChange={setSelectedWorkFields}
                placeholder="Select work fields"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cities</label>
              <MultiSelect
                options={cities}
                selected={selectedCities}
                onChange={setSelectedCities}
                placeholder="Select cities"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
              <MultiSelect
                options={citizenshipOptions}
                selected={selectedCitizenship}
                onChange={setSelectedCitizenship}
                placeholder="Select citizenship status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
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