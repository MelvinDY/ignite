import { Link } from "react-router-dom"
import SearchBar from "./SearchBar"
import { Bell } from "lucide-react"

const TopBar = ({imgSrc}: {imgSrc: string}) => {
  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex-between gap-2">
            {/* Possibly change it to logo? */}
            <Link className="flex items-center gap-2 mr-8" to='/dashboard'>
                <div className="w-10 h-10 rounded-60 bg-gray-200 flex-center font-bold text-lg text-gray-600">H</div>
            </Link>
            
            <SearchBar/>

            <div className="flex-center gap-2">
                <Link to="/profile">
                    <img src={imgSrc} alt="profile-picture" className="size-10 rounded-full"/>
                </Link>

                {/* Notification Icon */}
                <button className="rounded-full px-2 py-2 hover:bg-gray-100 transition-colors">
                    <Bell className="size-5 text-gray-600" />
                </button>
            </div>
        </div>
    </header>
  )
}

export default TopBar