
import React, { useMemo } from "react";
import { Bell, Bookmark, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import SearchBar from "../components/ui/SearchBar";
import ProfileCard from "../components/ui/ProfileCardFeed";
import PostCard from "../components/ui/PostsCardFeed";

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
    if (label.toLowerCase() === 'connections') {
        Icon = Users;
    } else if (label.toLowerCase() === 'bookmarks') {
        Icon = Bookmark;
    } else if (label.toLowerCase().startsWith('event')) {
        Icon = Calendar;
    } else {
        Icon = Bookmark;
    }
    
  return (
    <li className="flex items-center gap-2 px-4 h-11 hover:bg-gray-50 cursor-pointer">
      <Icon className="size-4 text-gray-600" />
      <span className="capitalize">{label}</span>
    </li>
  );
}

const FeedPage = () => {
  // THis is just sample data
    const currentUser: User = {
      name: "Degus Sudarmawan",
      title: "2nd Year Computer Science Student",
      location: "Surry Hills, New South Wales",
      avatarUrl: "https://placehold.co/400"
    };

    // This is just sample data
    const posts: Post[] = useMemo(
      () => [
        {
          id: "p1",
          author: { name: "degus sudarmawan", title: "Software Engineer • Google", location: "" },
          createdAt: "2 hr",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque feugiatshfsofsojfsojfsjofjsjfosofjsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          mediaUrl: "https://placehold.co/600x400",
          views: 27,
          likes: 16,
        },
        {
          id: "p2",
          author: { name: "degus sudarmawan", title: "Software Engineer • Google", location: "" },
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
          author: { name: "degus sudarmawan", title: "Software Engineer • Google", location: "" },
          createdAt: "2 hr",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque feugiat...",
          mediaUrl: "https://placehold.co/600x400",
          views: 27,
          likes: 16,
        },
      ],
      []
    );

    return (
      <div className="min-h-screen bg-[#3E000C]">
        {/* Top bar */}
        <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-4 h-16 flex-between gap-2">
            {/* Possibly change it to logo? */}
            <Link className="flex items-center gap-2" to='/dashboard'>
              <div className="w-10 h-10 rounded-60 bg-gray-200 flex-center font-bold text-lg text-gray-600">H</div>
            </Link>
            
            <SearchBar/>

            {/* Notification Icon */}
            <button className="rounded-full px-2 py-2 hover:bg-gray-100 transition-colors">
                <Bell className="size-5 text-gray-600" />
            </button>
          </div>
        </header>

        {/* Content grid */}
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)_300px] gap-6">
          {/* Left rail (profile) */}
          <aside className="md:sticky md:top-20 h-fit">
            <ProfileCard user={currentUser} />

            <nav className="mt-4 overflow-hidden rounded-xl bg-white text-black">
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
            <div className="h-[520px] rounded-xl bg-white/70 border border-white/10" />
          </aside>
        </div>
      </div>
    );
  };


export {FeedPage};
