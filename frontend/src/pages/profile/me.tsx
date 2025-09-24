import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  profileApi,
  type ProfileMe,
  type Education,
  ProfileApiError,
  type Experience,
} from "../../lib/api/profile";
import { ProfileLayout } from "../../components/ProfileLayout";
import { ProfileCard } from "../../components/ProfileCard";
import { ProfileExperience } from "../../components/ProfileExperience";
import { ProfileSkills } from "../../components/ProfileSkills";
import { EventsSidebar } from "../../components/EventsSidebar";
import { ProfileEducation } from "../../components/ProfileEducation";

export function MyProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const refetchEducations = useCallback(async () => {
    try {
      const data = await profileApi.getProfileEducations();
      setEducations(data);
    } catch (err) {
      // swallow refetch errors silently for now
    }
  }, []);

  const refetchExperiences = useCallback(async () => {
    try {
      const data = await profileApi.getProfileExperiences();
      setExperiences(data);
    } catch (err) {
      // swallow refetch errors silently for now
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await profileApi.getMyProfile();

        // If user doesn't have a handle, redirect to handle setup
        if (profileData.handle === null) {
          navigate("/profile/handle-setup");
          return;
        }

        // Fetch the education, experience and other things in the future
        const [educationData, experienceData] = await Promise.all([
          profileApi.getProfileEducations(),
          profileApi.getProfileExperiences(),
          // Add more calls here
        ]);

        setProfile(profileData);
        setEducations(educationData);
        setExperiences(experienceData);
      } catch (err) {
        if (
          err instanceof ProfileApiError &&
          err.code === "NOT_AUTHENTICATED"
        ) {
          navigate("/auth/login");
        } else {
          setError("Failed to load profile. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-[var(--dark-red)] to-[#8B1538] h-32 md:h-40 lg:h-48 animate-pulse"></div>

        <div className="w-full max-w-none px-0 sm:px-4 md:px-6 lg:px-8 xl:px-12 -mt-16 md:-mt-20 lg:-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* Main content skeleton */}
              <div className="xl:col-span-3 lg:col-span-2 space-y-4 md:space-y-6">
                {/* Profile header skeleton */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-pulse mx-4 sm:mx-0">
                  <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 w-full">
                      <div className="h-6 lg:h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-4 lg:h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content skeletons */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-pulse mx-4 sm:mx-0">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Sidebar skeleton */}
              <div className="xl:col-span-1 lg:col-span-1 space-y-4 md:space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 animate-pulse mx-4 sm:mx-0">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[var(--dark-red)] text-white rounded-md hover:bg-[var(--dark-red)]/90 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Convert ProfileMe to compatible format for components
  const profileForCard = {
    id: profile.id,
    handle: profile.handle,
    photoUrl: profile.photoUrl,
    bannerUrl: profile.bannerUrl,
    fullName: profile.fullName,
    bio: profile.bio,
    yearStart: profile.yearStart,
    yearGrad: profile.yearGrad,
    level: profile.level,
    program: profile.program,
    major: profile.major,
    isIndonesian: profile.isIndonesian,
    headline: profile.headline,
    domicileCity: profile.domicileCity,
    domicileCountry: profile.domicileCountry,
  };

  return (
    <ProfileLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-6">
            <ProfileCard
              profile={profileForCard}
              isOwnProfile={true}
              onPhotoUpdate={(newPhotoUrl) => {
                setProfile((prev) =>
                  prev ? { ...prev, photoUrl: newPhotoUrl } : null
                );
              }}
              onBannerUpdate={(newBannerUrl) => {
                setProfile((prev) =>
                  prev ? { ...prev, bannerUrl: newBannerUrl } : null
                );
              }}
            />
            <ProfileExperience
              experiences={experiences}
              isOwnProfile={true}
              onExperienceAdded={() => {
                refetchExperiences();
              }}
              onExperienceUpdated={() => {
                refetchExperiences();
              }}
              onExperienceDeleted={() => {
                refetchExperiences();
              }}
            />
            <ProfileEducation
              educations={educations}
              onEducationAdded={(e) => {
                setEducations((prev) => [e, ...prev]);
                refetchEducations();
              }}
              onEducationUpdated={(e) => {
                setEducations((prev) =>
                  prev.map((it) => (it.id === e.id ? e : it))
                );
                refetchEducations();
              }}
              onEducationDeleted={(id) =>
                setEducations((prev) => prev.filter((x) => x.id !== id))
              }
            />
            <ProfileSkills />
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
