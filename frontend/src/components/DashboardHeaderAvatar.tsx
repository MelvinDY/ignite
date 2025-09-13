import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi, type ProfileMe, ProfileApiError } from '../lib/api/profile';

export function DashboardHeaderAvatar() {
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileApi.getMyProfile();
        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        if (err instanceof ProfileApiError) {
          if (err.code === 'NOT_AUTHENTICATED') {
            setError('Please log in to view your profile');
          } else {
            setError(`Error: ${err.code}`);
          }
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    if (!profile) return;
    
    if (profile.handle === null) {
      navigate('/profile/handle-setup');
    } else {
      navigate('/profile/me');
    }
  };

  if (error) {
    return (
      <div className="flex items-center text-sm text-red-500" aria-label="Profile loading error">
        Profile error
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-8 bg-gray-300 rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <button
      onClick={handleAvatarClick}
      className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#3E000C]"
      aria-label="Open my profile"
    >
      {profile.photoUrl ? (
        <img
          src={profile.photoUrl}
          alt={`${profile.fullName}'s profile`}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
          {getInitials(profile.fullName)}
        </div>
      )}
    </button>
  );
}