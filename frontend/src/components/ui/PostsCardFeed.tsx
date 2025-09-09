import React, { useState } from 'react';
import { Heart, Bookmark, Bell } from 'lucide-react';
type User = {
  name: string;
  title: string;
  location?: string;
  avatarUrl?: string;
};

type Post = {
  id: string;
  author: User;
  createdAt: string;
  text: string;
  mediaUrl?: string;
  views: number;
  likes: number;
};

const MAX_LENGTH = 120;

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.text.length > MAX_LENGTH;
  const displayText = expanded || !isLong ? post.text : post.text.slice(0, MAX_LENGTH) + '...';
  
  // State for toggling button active status
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [notified, setNotified] = useState(false);

  return (
    <article className="rounded-xl bg-white shadow-sm border border-gray-200">
    {/* header */}
    <div className="p-4 flex gap-3 items-center">
        <img
            className="size-12 rounded-full bg-gray-300 shrink-0"
            src={post.author.avatarUrl || 'https://placehold.co/400'}
            alt={post.author.name}
        />
        <div className="flex-col justify-items-start">
            <h3 className="text-md capitalize font-semibold text-black">{post.author.name}</h3>
            <p className="text-xs text-gray-600">{post.author.title}</p>
            <p className="text-xs text-gray-600">{post.createdAt}</p>
        </div>
    </div>

    {/* content */}
    <div className="px-4 pb-2">
    <p className="mt-1 text-sm text-gray-800 break-words">
            {displayText}
            {isLong && !expanded && (
            <button
                className="ml-1 text-gray-500 hover:text-gray-700 underline underline-offset-2"
                onClick={() => setExpanded(true)}
            >
                see more
            </button>
            )}
            {isLong && expanded && (
            <button
                className="ml-1 text-gray-500 hover:text-gray-700 underline underline-offset-2"
                onClick={() => setExpanded(false)}
            >
                see less
            </button>
            )}
        </p>

        {post.mediaUrl && (
            <div className="w-full mt-3">
            <img
                src={post.mediaUrl}
                alt="post visual"
                className="w-full aspect-[16/9] object-cover rounded-lg"
                loading="lazy"
            />
            </div>
        )}
    </div>

    {/* footer */}
    <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500">
      <span>
        {post.views} views, {post.likes} likes
      </span>
      <div className="flex items-center gap-4">
        <button
          className={`flex items-center gap-1 ${liked ? 'text-red-500 hover:text-red-700' : 'hover:text-gray-700'}`}
          onClick={() => setLiked((prev) => !prev)}
        >
          <Heart className="size-4" fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`flex items-center gap-1 ${bookmarked ? 'text-blue-500 hover:text-blue-700' : 'hover:text-gray-700'}`}
          onClick={() => setBookmarked((prev) => !prev)}
        >
          <Bookmark className="size-4" fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`flex items-center gap-1 ${notified ? 'text-yellow-500 hover:text-yellow-700' : 'hover:text-gray-700'}`}
          onClick={() => setNotified((prev) => !prev)}
        >
          <Bell className="size-4" fill={notified ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  </article>
  )
}

export default PostCard;