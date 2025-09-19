import { Link } from "react-router-dom"
import SearchBar from "./SearchBar"
import { Bell } from "lucide-react"

interface TopBarProps {
  imgSrc: string | null;
  initials: string;
  handle?: string | null;
}

const TopBar = ({imgSrc, initials, handle}: TopBarProps) => {
  return (
    <header className="sticky top-0 z-20 w-full bg-[#7C0B2B] border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex-between gap-2">
            {/* Possibly change it to logo? */}
            <Link className="flex items-center gap-2 mr-8" to='/dashboard'>
                <div className="w-10 h-10 rounded-60 bg-gray-200 flex-center font-bold text-lg text-gray-600">H</div>
            </Link>
            
            <SearchBar/>

            <div className="flex-center gap-2">
                <Link to="/profile/me">
                    {imgSrc ? (
											<img src={imgSrc} alt="profile-picture" className="size-10 rounded-full"/>
										) : (
											<div className="size-10 sm:size-6 md:size-8 lg:size-10 rounded-full bg-gray-200 flex-center sm:text-sm md:text-md lg:text-lg font-bold text-black">
                  			{initials}
                			</div>
										)}
                </Link>

                {/* Notification Icon */}
                <button className="rounded-full px-2 py-2 hover:text-[#fbbf39] transition-colors">
                    <Bell className="size-5" />
                </button>
            </div>
        </div>
    </header>
  )
}

export default TopBar
