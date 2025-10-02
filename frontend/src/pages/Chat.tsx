import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { MobileNavbar } from '../components/MobileNavbar';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
}

interface ChatUser {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');

  const mockUsers: ChatUser[] = [
    {
      id: 1,
      name: 'Sarah Chen',
      avatar: '👩🏻‍💼',
      lastMessage: 'See you at the ICON event!',
      timestamp: '2m ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Ahmad Rahman',
      avatar: '👨🏽‍💻',
      lastMessage: 'Thanks for the membership info',
      timestamp: '15m ago',
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: 'Jessica Tan',
      avatar: '👩🏻‍🎓',
      lastMessage: 'Is the INM event still happening?',
      timestamp: '1h ago',
      unread: 1,
      online: false
    },
    {
      id: 4,
      name: 'David Wijaya',
      avatar: '👨🏽‍🎓',
      lastMessage: 'Great meeting you at the workshop!',
      timestamp: '3h ago',
      unread: 0,
      online: false
    },
    {
      id: 5,
      name: 'Michelle Lee',
      avatar: '👩🏻‍🔬',
      lastMessage: 'Can you send me the event details?',
      timestamp: 'Yesterday',
      unread: 0,
      online: true
    }
  ];

  const mockMessages: { [key: number]: Message[] } = {
    1: [
      { id: 1, text: 'Hey! Are you going to ICON 2025?', sender: 'other', timestamp: '10:30 AM' },
      { id: 2, text: 'Yes! I already registered. Super excited!', sender: 'user', timestamp: '10:32 AM' },
      { id: 3, text: 'Awesome! Which workshops are you attending?', sender: 'other', timestamp: '10:33 AM' },
      { id: 4, text: 'I signed up for the professional development and networking sessions', sender: 'user', timestamp: '10:35 AM' },
      { id: 5, text: 'See you at the ICON event!', sender: 'other', timestamp: '10:36 AM' }
    ],
    2: [
      { id: 1, text: 'Hi! How do I become a PPIA member?', sender: 'other', timestamp: '9:15 AM' },
      { id: 2, text: 'You can register through the Arc Portal or at our O-Week booth!', sender: 'user', timestamp: '9:20 AM' },
      { id: 3, text: 'Thanks for the membership info', sender: 'other', timestamp: '9:22 AM' }
    ],
    3: [
      { id: 1, text: 'Is the INM event still happening?', sender: 'other', timestamp: '8:30 AM' },
      { id: 2, text: 'Yes! Indonesian Night Market 2025 is coming soon!', sender: 'user', timestamp: '8:35 AM' }
    ],
    4: [
      { id: 1, text: 'Great meeting you at the workshop!', sender: 'other', timestamp: 'Yesterday' }
    ],
    5: [
      { id: 1, text: 'Can you send me the event details?', sender: 'other', timestamp: '2 days ago' }
    ]
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) setMessageInput('');
  };

  const selectedUser = mockUsers.find(u => u.id === selectedChat);
  const messages = selectedChat ? mockMessages[selectedChat] : [];

  return (
    <>
      {/* Keep navbar see-through */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="block md:hidden">
        <MobileNavbar />
      </div>

      {/* 🔴 Red gradient sits BEHIND everything, including the transparent navbar */}
      <div
        className="min-h-screen bg-cover bg-center pt-16"  // pt-16 = navbar height
        style={{
          backgroundImage:
            'linear-gradient(rgba(62,0,12,0.85), rgba(107,0,21,0.85))',
        }}
      >
        {/* Translucent chat shell so the red bleeds through slightly */}
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          <div className="flex h-full rounded-lg overflow-hidden border border-white/20 bg-white/80 backdrop-blur-md">
            {/* Users List */}
            <div className="w-80 bg-white/70 border-r border-white/30">
              <div className="p-6 border-b border-white/30">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:border-[#3E000C]"
                />
              </div>
              <div className="overflow-y-auto h-[calc(100%-120px)]">
                {mockUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedChat(user.id)}
                    className={`p-4 cursor-pointer transition-colors border-b border-white/30 hover:bg-white/60 ${
                      selectedChat === user.id ? 'bg-white/70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5E6D3] to-[#FAF0E6] flex items-center justify-center text-2xl">
                          {user.avatar}
                        </div>
                        {user.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                          <span className="text-xs text-gray-600">{user.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{user.lastMessage}</p>
                      </div>
                      {user.unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-[#3E000C] text-white text-xs flex items-center justify-center">
                          {user.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 bg-white/80 border-b border-white/30 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5E6D3] to-[#FAF0E6] flex items-center justify-center text-2xl">
                          {selectedUser.avatar}
                        </div>
                        {selectedUser.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-600">
                          {selectedUser.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/60">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl ${
                            m.sender === 'user'
                              ? 'bg-gradient-to-br from-[#3E000C] to-[#6B0015] text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p>{m.text}</p>
                          <p className={`text-xs mt-1 ${m.sender === 'user' ? 'opacity-60' : 'text-gray-500'}`}>
                            {m.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-6 bg-white/80 border-t border-white/30 backdrop-blur">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:border-[#3E000C]"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-3 bg-gradient-to-br from-[#3E000C] to-[#6B0015] text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white/60">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect with PPIA Members</h3>
                    <p className="text-gray-700">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
