import { Link } from "react-router-dom";

interface UserProps {
  user: {
    id: string;
    fullName: string;
    handle: string | null;
    photoUrl: string | null;
    headline: string | null;
    domicileCity: string | null;
    domicileCountry: string | null;
    bio: string | null;
  }
};

const ProfileCard = ({ user }: UserProps) => {
  const location = [user.domicileCity?.trim(), user.domicileCountry?.trim()]
    .filter((v): v is string => !! v && v.length > 0)
    .join(', ');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link to="/profile/me">
      <div className="overflow-hidden white-card">
          <div className="h-20 w-full bg-[url('https://placehold.co/300x200')] bg-cover bg-center" />
          <div className="px-4 pb-4 flex-col justify-items-start text-black min-w-0">
            <div className="-mt-6 mb-3">
              {user.photoUrl ? (
                <img className="size-16 rounded-full border-4 border-white bg-gray-200" src={user.photoUrl}/>
              ) : (
                <div className="size-16 sm:size-12 md:size-14 lg:size-16 rounded-full border-4 border-white bg-gray-200 flex-center sm:text-sm md:text-md lg:text-lg font-bold shadow-md">
                  {getInitials(user.fullName)}
                </div>
              )}
            </div>
            <div className="flex justify-center items-start flex-col w-full min-w-0">
              <h2 className="font-semibold leading-tight text-xl truncate w-full">{user.fullName}</h2>
              <p className="text-sm text-gray-600 truncate w-full">@{user.handle}</p>
            </div>
            <p className="text-md text-gray-500 mt-2 mb-4 truncate w-full">{user.headline ?? ''}</p>
            {location && (
              <p className="text-sm text-gray-500 truncate w-full">{location}</p>
            )}
          </div>
      </div>
    </Link>
  )
}

export default ProfileCard
