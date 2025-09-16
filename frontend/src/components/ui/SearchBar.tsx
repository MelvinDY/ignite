import { Search } from 'lucide-react'

const SearchBar = ({query}: {query? : string}) => {
  return (
    <div className="w-full max-w-md flex-between gap-2">
        <input
        className="w-full h-10 px-4 rounded-full border border-gray-300 bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        defaultValue={query}
        name="query"
        placeholder="Search"
        autoComplete="off"
        />
        
        <button type="submit" className=" text-white hover:text-[#fbbf39]">
            <Search className="size-5" />
        </button>
    </div>
  )
}

export default SearchBar