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
    if (messageInput.trim() && selectedChat) {
      // Mock sending - in real app, this would send to backend
      setMessageInput('');
    }
  };

  const selectedUser = mockUsers.find(u => u.id === selectedChat);
  const messages = selectedChat ? mockMessages[selectedChat] : [];

  return (
    <>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="block md:hidden">
        <MobileNavbar />
      </div>
      <div className="min-h-screen bg-white pt-16">
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          <div className="flex h-full border border-gray-200 rounded-lg overflow-hidden">
            {/* Users List */}
            <div className="w-80 bg-gray-50 border-r border-gray-200">
              <div className="p-6 border-b border-gray-200">
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
                    className={`p-4 cursor-pointer transition-colors border-b border-gray-200 hover:bg-gray-100 ${
                      selectedChat === user.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5E6D3] to-[#FAF0E6] flex items-center justify-center text-2xl">
                          {user.avatar}
                        </div>
                        {user.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                          <span className="text-xs text-gray-500">{user.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{user.lastMessage}</p>
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
                  <div className="p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5E6D3] to-[#FAF0E6] flex items-center justify-center text-2xl">
                          {selectedUser.avatar}
                        </div>
                        {selectedUser.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedUser.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-br from-[#3E000C] to-[#6B0015] text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'opacity-60' : 'text-gray-500'}`}>{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-6 bg-white border-t border-gray-200">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:border-[#3E000C]"
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
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Connect with PPIA Members
                    </h3>
                    <p className="text-gray-600">
                      Select a conversation to start chatting
                    </p>
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
