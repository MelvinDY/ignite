import { type SearchProfile, type SearchResponse } from '../../lib/api/search';
import { MapPin, Briefcase, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchResults,
  loading,
  error
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleProfileClick = (profile: SearchProfile) => {
    if (profile.handle) {
      navigate(`/profile/${profile.handle}`);
      onClose();
    }
  };

  const ProfileCard: React.FC<{ profile: SearchProfile }> = ({ profile }) => {
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleProfileClick(profile)}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-lg">
                {getInitials(profile.fullName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {profile.fullName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">@{profile.handle}</p>

                {profile.headline && (
                  <div className="flex items-center gap-1 text-sm text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{profile.headline}</span>
                  </div>
                )}

                {(profile.domicileCity || profile.domicileCountry) && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {[profile.domicileCity, profile.domicileCountry].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {profile.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {profile.bio}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle connect action here
                }}
                className="ml-4 px-4 py-2 bg-[#7C0B2B] text-white text-sm rounded-md hover:bg-[#7C0B2B]/90 transition-colors"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      );
    }

    if (!searchResults || searchResults.results.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results ({searchResults.pagination.total})
          </h3>
          <div className="text-sm text-gray-600">
            Page {searchResults.pagination.page} of {searchResults.pagination.totalPages}
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {searchResults.results.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>

        {searchResults.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4 border-t border-gray-200">
            <button
              disabled={searchResults.pagination.page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {searchResults.pagination.page} of {searchResults.pagination.totalPages}
            </span>

            <button
              disabled={searchResults.pagination.page >= searchResults.pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;