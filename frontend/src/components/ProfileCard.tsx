import { MapPin, Calendar, GraduationCap, Building, Award, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileData {
  id: string;
  handle: string | null;
  photoUrl: string | null;
  fullName: string;
  bio: string | null;
  yearStart: number;
  yearGrad?: number | null;
  level: string;
  program: string | null;
  major: string | null;
  isIndonesian?: boolean;
  headline?: string | null;
  domicileCity?: string | null;
  domicileCountry?: string | null;
  cgpa?: number | null;
}

interface ProfileCardProps {
  profile: ProfileData;
  isOwnProfile?: boolean;
}

export function ProfileCard({ profile, isOwnProfile = false }: ProfileCardProps) {
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatLevel = (level: string) => {
    const levelMap: Record<string, string> = {
      foundation: 'Foundation',
      diploma: 'Diploma',
      undergrad: 'Undergraduate',
      postgrad: 'Postgraduate',
      phd: 'PhD',
    };
    return levelMap[level] || level.charAt(0).toUpperCase() + level.slice(1);
  };


  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Rectangular Cover Image */}
      <div className="relative h-[200px] bg-gradient-to-r from-[#3E000C] to-[#8B1538]">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern
                id="cover-pattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="white" opacity="0.3" />
                <circle cx="12" cy="12" r="1.5" fill="white" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#cover-pattern)" />
          </svg>
        </div>

        {isOwnProfile && (
          <button className="absolute bottom-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors">
            Change Cover
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Profile Avatar - Overlapping the cover */}
        <div className="flex items-end -mt-16 mb-4">
          <div className="relative">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-[#3E000C] to-[#8B1538] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {getInitials(profile.fullName)}
              </div>
            )}
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {isOwnProfile && (
            <Link
              to="/profile/edit"
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-[#3E000C] text-white rounded-lg hover:bg-[#3E000C]/90 transition-colors text-sm font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Link>
          )}
        </div>

        {/* Name and Basic Info */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {profile.fullName}
          </h1>
          {profile.handle && (
            <p className="text-gray-600 mb-2">@{profile.handle}</p>
          )}
          {profile.headline && (
            <p className="text-gray-700 font-medium mb-3">{profile.headline}</p>
          )}
          {profile.bio && (
            <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <GraduationCap className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Level</p>
              <p className="text-sm font-medium">{formatLevel(profile.level)}</p>
            </div>
          </div>

          {profile.program && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Building className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Program</p>
                <p className="text-sm font-medium">{profile.program}</p>
              </div>
            </div>
          )}

          {profile.major && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Award className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Major</p>
                <p className="text-sm font-medium">{profile.major}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Year Intake</p>
              <p className="text-sm font-medium">{profile.yearStart}</p>
            </div>
          </div>

          {profile.domicileCity && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium">
                  {profile.domicileCity}
                  {profile.domicileCountry && `, ${profile.domicileCountry}`}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {profile.isIndonesian && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#3E000C] to-[#8B1538] text-white">
              🎓 Indonesian Student
            </span>
          )}
          {profile.yearGrad && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Alumni {profile.yearGrad}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}