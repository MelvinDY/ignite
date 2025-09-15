import React from 'react';

interface ProfileHeaderProps {
  profile: {
    id: string;
    handle: string;
    zid: string;
    photo_url: string | null;
    full_name: string;
    bio: string | null;
    year_intake: number;
    level: string;
    program: string;
    major: string;
    is_indonesian: boolean;
    experience: any[];
    skills: any[];
  };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="relative bg-gradient-to-r from-[#3E000C] to-[#8B1538] rounded-lg mx-4 sm:mx-0 p-4 md:p-6 lg:p-8 text-white shadow-xl">
      {/* Banner Background Pattern (non-interactive; constrained to header) */}
      <div className="absolute inset-0 opacity-10 rounded-lg pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-lg"></div>
      </div>
      
      <div className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 lg:gap-8">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={`${profile.full_name}'s profile`}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-4 border-white/20 object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold shadow-lg">
                {getInitials(profile.full_name)}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {profile.full_name}
              </h1>
              <p className="text-white/80 text-sm md:text-base mb-1">
                {profile.zid}
              </p>
              <p className="text-white/70 text-sm md:text-base">
                @{profile.handle}
              </p>
            </div>

            {/* Academic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Program
                </p>
                <p className="text-white text-sm md:text-base">
                  {profile.program}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Major
                </p>
                <p className="text-white text-sm md:text-base">
                  {profile.major}
                </p>
              </div>
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
                  Year Intake
                </p>
                <p className="text-white text-sm md:text-base">
                  {profile.year_intake}
                </p>
              </div>
            </div>

            {/* Bio */}
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

        {/* Indonesian Badge */}
        {profile.is_indonesian && (
          <div className="mt-6 flex justify-start">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
              🇮🇩 Indonesian Student
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
