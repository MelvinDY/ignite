type User = {
  name: string;
  title: string;
  location?: string;
  avatarUrl?: string;
};

const ProfileCard = ({user}: {user: User}) => {
  return (
    <div className="rounded-xl bg-white overflow-hidden">
        <div className="h-20 w-full bg-[url('https://placehold.co/300x200')] bg-cover bg-center" />
        <div className="px-4 pb-4 flex-col justify-items-start text-black">
          <div className="-mt-6 mb-3">
            <img className="size-16 rounded-full border-4 border-white bg-gray-200" src={user.avatarUrl}/>
          </div>
          <h2 className="font-semibold leading-tight mb-3">{user.name}</h2>
          <p className="text-sm text-gray-600">{user.title}</p>
          <p className="text-xs text-gray-500">{user.location}</p>
          <span className="inline-block mt-3 text-xs text-gray-500">Current Student</span>
        </div>
      </div>
  )
}

export default ProfileCard