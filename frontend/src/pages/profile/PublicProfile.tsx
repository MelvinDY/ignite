import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  profileApi,
  type PublicProfile,
  ProfileApiError,
} from "../../lib/api/profile";
import { ProfileLayout } from "../../components/ProfileLayout";
import { ProfileCard } from "../../components/ProfileCard";
import { EventsSidebar } from "../../components/EventsSidebar";
import { useAuth } from "../../hooks/useAuth";

function PublicProfileHeader({ profile }: { profile: PublicProfile }) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const formatLevel = (level: string) =>
    level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div className="relative bg-gradient-to-r from-[var(--dark-red)] to-[#8B1538] rounded-lg mx-4 sm:mx-0 p-4 md:p-6 lg:p-8 text-white shadow-xl">
      <div className="absolute inset-0 opacity-10 rounded-lg pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-lg"></div>
      </div>
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 lg:gap-8">
          <div className="flex-shrink-0">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={`${profile.fullName}'s profile`}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-4 border-white/20 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold shadow-lg">
                {getInitials(profile.fullName)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {profile.fullName}
              </h1>
              <p className="text-white/70 text-sm md:text-base">
                @{profile.handle}
              </p>
              {profile.headline && (
                <p className="text-white/80 text-sm md:text-base mt-1">
                  {profile.headline}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {profile.program && (
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Program
                  </p>
                  <p className="text-white text-sm md:text-base">
                    {profile.program}
                  </p>
                </div>
              )}
              {profile.major && (
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Major
                  </p>
                  <p className="text-white text-sm md:text-base">
                    {profile.major}
                  </p>
                </div>
              )}
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Level
                </p>
                <p className="text-white text-sm md:text-base">
                  {formatLevel(profile.level)}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Year Start
                </p>
                <p className="text-white text-sm md:text-base">
                  {profile.yearStart}
                </p>
              </div>
              {profile.domicileCity && (
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                    Location
                  </p>
                  <p className="text-white text-sm md:text-base">
                    {profile.domicileCity}
                  </p>
                </div>
              )}
            </div>
            {profile.bio && (
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-2">
                  About
                </p>
                <p className="text-white/90 text-sm md:text-base leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) {
        setError("Invalid profile URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to fetch public profile first
        const publicProfile = await profileApi.getPublicProfile(slug);
        setProfile(publicProfile);

        // Check if it's the user's own profile (only if authenticated)
        if (isAuthenticated) {
          try {
            const myProfile = await profileApi.getMyProfile();
            setIsOwnProfile(myProfile.handle === slug);
          } catch (err) {
            // If we can't get myProfile, assume it's not own profile
            setIsOwnProfile(false);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (err instanceof ProfileApiError) {
          if (err.code === "PROFILE_NOT_FOUND") {
            setError("Profile not found");
          } else {
            setError("Unable to load profile");
          }
        } else {
          setError("Unable to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug, isAuthenticated]);

  if (loading) {
    return (
      <ProfileLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-48 md:h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
            <div className="px-6 pb-6">
              <div className="-mt-16 mb-4">
                <div className="w-32 h-32 rounded-full bg-gray-300"></div>
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  if (error) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error === "Profile not found"
                ? "Profile Not Found"
                : "Error Loading Profile"}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-[#3E000C] text-white rounded-md hover:bg-[#3E000C]/90 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  if (!profile) return null;

  // Convert to ProfileCard format
  const profileForCard = {
    id: profile.id,
    handle: profile.handle,
    photoUrl: profile.photoUrl,
    fullName: profile.fullName,
    bio: profile.bio,
    yearStart: profile.yearStart,
    yearGrad: profile.yearGrad,
    level: profile.level,
    program: profile.program,
    major: profile.major,
    headline: profile.headline,
    domicileCity: profile.domicileCity,
    domicileCountry: profile.domicileCountry,
    isIndonesian: profile.isIndonesian,
  };

  return (
    <ProfileLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-6">
            <ProfileCard profile={profileForCard} isOwnProfile={isOwnProfile} />

            {/* Placeholder sections for Experience, Education, Skills */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Experience
              </h2>
              <p className="text-gray-500 text-center py-8">
                No experience information available
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Education
              </h2>
              <p className="text-gray-500 text-center py-8">
                No education information available
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
              <p className="text-gray-500 text-center py-8">
                No skills information available
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 lg:col-span-1">
            <div className="sticky top-24">
              <EventsSidebar />
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
