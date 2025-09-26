import { useEffect, useMemo, useState } from "react";
import { Bookmark, Users, Calendar } from "lucide-react";
import ProfileCard from "../../components/ui/ProfileCardFeed";
import PostCard from "../../components/ui/PostsCardFeed";
import TopBar from "../../components/ui/TopBar";
import SearchModal from "../../components/ui/SearchModal";
import { useNavigate } from "react-router-dom";
import {
  profileApi,
  ProfileApiError,
  type ProfileMe,
} from "../../lib/api/profile";
import { searchApi, SearchApiError, type SearchFilters, type SearchResponse } from "../../lib/api/search";

type User = {
  name: string;
  title: string;
  location: string;
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

function NavItem({ label }: { label: string }) {
  let Icon;
  if (label.toLowerCase() === "connections") {
    Icon = Users;
  } else if (label.toLowerCase() === "bookmarks") {
    Icon = Bookmark;
  } else if (label.toLowerCase().startsWith("event")) {
    Icon = Calendar;
  } else {
    Icon = Bookmark;
  }

  return (
    <li className="flex items-center gap-2 px-4 h-11 hover:bg-gray-50 cursor-pointer">
      <Icon className="size-4 text-gray-700" />
      <span className="capitalize text-lg">{label}</span>
    </li>
  );
}

export const FeedPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search states
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);


  // This is just sample data
  const posts: Post[] = useMemo(
    () => [
      {
        id: "p1",
        author: {
          name: "degus sudarmawan",
          title: "Software Engineer • Google",
          location: "",
        },
        createdAt: "2 hr",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque feugiatshfsofsojfsojfsjofjsjfosofjsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        mediaUrl: "https://placehold.co/600x400",
        views: 27,
        likes: 16,
      },
      {
        id: "p2",
        author: {
          name: "degus sudarmawan",
          title: "Software Engineer • Google",
          location: "",
        },
        createdAt: "2 hr",
        text: `Dengan bangga saya mengumumkan bahwa saya telah menyelesaikan program pelatihan \"Fundamental of Machine Learning\" dari Digital Talent Scholarship melalui platform DQLab.
              Selama pelatihan ini, saya mempelajari berbagai materi penting antara lain :

              ✅Guide to Learn Python with AI at DQLab
              ✅Perkenalan Data Scientist dengan Cerita Kasus Retail
              ✅Exploratory Data Analysis with Python for Beginner
              ✅Pengantar Machine Learning dengan Python
              ✅Machine Learning: Algoritma K-Means dengan Python
              ✅Metrik Statistik Penting pada Algoritma Clustering K-Means
              ✅Data Quality with Python for Beginner
              ✅Data Science in Telco: Data Cleansing
              ✅Multiclass Classification dengan Algoritma Multinomial Naive Bayes dan k-Nearest Neighbors
              ✅Binary Classification
              ✅Training Set dan Testing Set pada Machine Learning
              ✅Implementasi Decision Tree dengan Random Forest
              ✅Metrik Penting pada Algoritma Random Forest
              ✅Implementasi Decision Tree dengan CART
              ✅Pengantar Storytelling dengan Visualisasi menggunakan Python
              ✅Data Science in Marketing : Customer Segmentation with Python - Part 1
              ✅Data Science in Marketing : Customer Segmentation with Python - Part 2
              ✅Master Data and Handling Duplicate Data with LinkR

              Pengalaman ini semakin memperkuat kemampuan saya dalam data science dan machine learning, serta mempersiapkan saya untuk menghadapi tantangan di dunia digital yang terus berkembang. Terima kasih Digital Talent Scholarship dan DQLab atas kesempatan dan ilmunya!
              hashtag#MachineLearning hashtag#DataScience hashtag#Python hashtag#Digitalent hashtag#DQLab hashtag#LearningJourney hashtag#CustomerSegmentation hashtag#DataVisualization`,
        mediaUrl: "https://placehold.co/600x400",
        views: 27,
        likes: 16,
      },
      {
        id: "p3",
        author: {
          name: "degus sudarmawan",
          title: "Software Engineer • Google",
          location: "",
        },
        createdAt: "2 hr",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque feugiat...",
        mediaUrl: "https://placehold.co/600x400",
        views: 27,
        likes: 16,
      },
    ],
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await profileApi.getMyProfile();

        if (profileData.handle === null) {
          navigate("/profile/handle-setup");
          return;
        }

        setProfile(profileData);
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

    checkAuth();
  }, [navigate]);

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setSearchLoading(true);
      setSearchError(null);
      setIsSearchModalOpen(true);

      const results = await searchApi.searchDirectory(filters);
      setSearchResults(results);
    } catch (err) {
      if (err instanceof SearchApiError) {
        if (err.code === "NOT_AUTHENTICATED") {
          setSearchError("Please log in to search profiles. The lookup filters work without login, but searching requires authentication.");
          setSearchResults({ results: [], pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 } });
          return;
        }
        setSearchError(err.message);
      } else {
        setSearchError("Failed to search. Please try again.");
      }
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearchModalOpen(false);
    setSearchResults(null);
    setSearchError(null);
  };

  const handleCloseModal = () => {
    setIsSearchModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        {/* Top bar skeleton */}
        <header className="sticky top-0 z-20 w-full bg-[#7C0B2B] border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 h-16 flex-between gap-2 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-300" />
            <div className="flex-1 h-10 bg-gray-300 rounded mx-4" />
            <div className="w-20 h-10 bg-gray-300 rounded" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)_300px] gap-6 mt-4">
          {/* Left rail skeleton */}
          <aside className="hidden md:block space-y-4">
            <div className="white-card p-4 animate-pulse">
              <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
            <div className="white-card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </aside>

          {/* Feed skeleton */}
          <section className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="white-card p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="mt-4 h-40 bg-gray-200 rounded" />
              </div>
            ))}
          </section>

          {/* Right rail skeleton */}
          <aside className="hidden md:block">
            <div className="white-card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </aside>
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
            Error Loading Feed
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

  if (!profile) return null;

  const userProfile = {
    id: profile.id,
    fullName: profile.fullName,
    handle: profile.handle,
    photoUrl: profile.photoUrl,
    headline: profile.headline,
    domicileCity: profile.domicileCity,
    domicileCountry: profile.domicileCountry,
    bio: profile.bio,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Top bar */}
      <TopBar
        imgSrc={userProfile.photoUrl}
        initials={getInitials(userProfile.fullName)}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      />

      {/* Content grid */}
      <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)_300px] gap-6">
        {/* Left rail (profile) */}
        <aside className="md:sticky md:top-20 h-fit">
          <ProfileCard user={userProfile} />

          <nav className="mt-4 overflow-hidden white-card">
            <ul className="divide-y text-sm">
              <NavItem label="Connections" />
              <NavItem label="Bookmarks" />
              <NavItem label="Events" />
            </ul>
          </nav>
        </aside>

        {/* Feed */}
        <section className="space-y-4 pt-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>

        {/* Right rail (widget) */}
        <aside className="hidden md:block md:sticky md:top-20 pt-4">
          <div className="h-[520px] flex flex-col white-card">
            <div className="flex items-center gap-2 p-5">
              <Calendar className="size-5 text-gray-700" />
              <span className="text-black font-semibold text-lg">
                Upcoming Events
              </span>
            </div>
            <div className="h-full flex-center flex-col p-5 pb-7">
              <Calendar className="w-20 h-20 text-gray-300 mb-4" />
              <span className="text-gray-500 text-lg font-medium">
                No upcoming events
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={handleCloseModal}
        searchResults={searchResults}
        loading={searchLoading}
        error={searchError}
      />
    </div>
  );
};
