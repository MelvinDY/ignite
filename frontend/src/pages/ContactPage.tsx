import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  const socialLinks = [
    { name: 'Instagram', url: 'https://instagram.com/ppiaunsw', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/ppiaunsw', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { name: 'TikTok', url: 'https://tiktok.com/@ppiaunsw', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' }
  ];

  return (
    <div className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.6s ease;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .input-modern {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .input-modern:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #F5E6D3;
          outline: none;
        }

        .social-icon {
          transition: all 0.3s ease;
        }

        .social-icon:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, #3E000C, #6B0015);
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .shimmer {
          background: linear-gradient(90deg,
            #3E000C 0%,
            #6B0015 45%,
            #F5E6D3 50%,
            #6B0015 55%,
            #3E000C 100%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        .divider-gradient {
          background: linear-gradient(90deg, transparent, #F5E6D3, transparent);
          height: 1px;
          width: 100%;
        }
      `}</style>

      {/* Compact Header */}
      <div className="fade-in px-5 pt-16 pb-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] text-gray-400 mb-3">PPIA UNSW</p>
          <h1 className="text-5xl md:text-6xl font-extralight text-white mb-2">
            Contact <span className="font-bold">Us</span>
          </h1>
          <div className="divider-gradient max-w-32 mx-auto mt-6"></div>
        </div>
      </div>

      {/* Main Content - Compact Layout */}
      <div className="px-5 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">

            {/* Contact Form - 3 columns */}
            <div className="md:col-span-3 fade-in">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-2xl font-light text-white mb-6">
                  Send us a <span className="font-semibold">message</span>
                </h2>

                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-modern px-4 py-3 rounded-lg text-white placeholder-gray-500 text-sm"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-modern w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 text-sm"
                    />
                  </div>

                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-modern w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 text-sm"
                  />

                  <textarea
                    name="message"
                    placeholder="Message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="input-modern w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 text-sm resize-none"
                  />

                  <button
                    onClick={handleSubmit}
                    className="shimmer w-full py-3 rounded-lg font-medium text-white transition-all hover:scale-[1.02]"
                  >
                    Send Message
                  </button>
                </div>
              </div>

              {/* Quick Info - Below Form */}
              <div className="glass-card rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-light text-white mb-4">Quick Info</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <a href="mailto:unsw.ppia@gmail.com" className="text-sm text-white hover:text-gray-300 break-all">
                      unsw.ppia@gmail.com
                    </a>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Location</p>
                    <p className="text-sm text-white">UNSW Sydney, NSW 2033</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Active Hours</p>
                    <p className="text-sm text-white">Mon-Fri, 9AM-5PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Sidebar - 2 columns */}
            <div className="md:col-span-2 fade-in">
              <div className="glass-card rounded-2xl p-6 h-full">
                <h3 className="text-lg font-light text-white mb-6">Follow Us</h3>

                <div className="space-y-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHoveredIcon(social.name)}
                      onMouseLeave={() => setHoveredIcon(null)}
                      className="flex items-center gap-4 p-4 rounded-xl transition-all"
                      style={{
                        background: hoveredIcon === social.name
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                        border: '1px solid',
                        borderColor: hoveredIcon === social.name
                          ? 'rgba(245, 230, 211, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div
                        className="social-icon w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: hoveredIcon === social.name
                            ? 'linear-gradient(135deg, #3E000C, #6B0015)'
                            : 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d={social.icon} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{social.name}</p>
                        <p className="text-xs text-gray-400">@ppiaunsw</p>
                      </div>
                      <span className="text-gray-500 text-sm">→</span>
                    </a>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3">Stay connected</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Follow our social media for the latest updates on events, announcements, and community activities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© 2024-2025 PPIA UNSW</p>
            <p className="text-sm text-gray-400">Indonesian Students Association</p>
          </div>
        </div>
      </div>
    </div>
  );
}