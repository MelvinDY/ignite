import { useEffect, useRef, useState } from 'react';
import { Navbar } from "../../components/Navbar";
import { MobileNavbar } from "../../components/MobileNavbar";

export default function MembershipBenefits() {
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    stepsRef.current.forEach(step => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      name: "Bintang BRO",
      discount: "10% OFF",
      condition: "Only for orders made from the counter",
      logo: "/images/bintang-bro-logo.png" // Replace with actual logo path
    },
    {
      name: "SHARE TEA",
      discount: "FREE UPSIZE",
      condition: "Only at Haymarket Branch",
      logo: "/images/share-tea-logo.png" // Replace with actual logo path
    },
    {
      name: "Kirribilli Pizzeria",
      discount: "10% OFF",
      condition: "Order in, for purchases over $30",
      logo: "/images/kirribilli-logo.png" // Replace with actual logo path
    },
    {
      name: "The Sambal",
      discount: "10% OFF",
      condition: "On all dine-in and takeaway orders",
      logo: "/images/sambal-logo.png" // Replace with actual logo path
    },
    {
      name: "The Bowls",
      discount: "15% OFF",
      condition: "On all menu items",
      logo: "/images/bowls-logo.png" // Replace with actual logo path
    },
    {
      name: "Mie Kocok Bandung",
      discount: "10% OFF",
      condition: "On main Courses, Dine in only",
      logo: "/images/mie-kocok-logo.png" // Replace with actual logo path
    }
  ];

  const registrationSteps = [
    "Reach out to us via email or Instagram.",
    "Complete the registration form provided.",
    "Proceed with the payment process.",
    "Receive your PPIA membership card and member number."
  ];

  return (
    <>
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="block md:hidden">
        <MobileNavbar />
      </div>
      <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #0D1F3D 0%, #1A2F4F 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(245, 230, 211, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .pulse-shape {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(62, 0, 12, 0.2), transparent);
          animation: pulse 4s ease-in-out infinite;
        }

        .hero-text {
          animation: fadeInUp 0.8s ease;
        }

        .hero-subtitle {
          animation: fadeInUp 1s ease;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .marquee {
          animation: scroll 30s linear infinite;
        }

        .marquee-container:hover .marquee {
          animation-play-state: paused;
        }

        .registration-step {
          opacity: 0;
        }

        .registration-step.visible {
          animation: slideIn 0.6s ease forwards;
        }

        .registration-step:nth-child(1) { animation-delay: 0.1s; }
        .registration-step:nth-child(2) { animation-delay: 0.2s; }
        .registration-step:nth-child(3) { animation-delay: 0.3s; }
        .registration-step:nth-child(4) { animation-delay: 0.4s; }

        .benefit-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(145deg, #F5E6D3, #FAF0E6);
          position: relative;
          overflow: hidden;
        }

        .benefit-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(183, 28, 28, 0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        .benefit-card:hover::before {
          opacity: 1;
        }

        .benefit-card:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .gradient-text {
          background: linear-gradient(135deg, #3E000C, #6B0015);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .shimmer-button {
          position: relative;
          overflow: hidden;
        }

        .shimmer-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        .modern-border {
          position: relative;
          background: linear-gradient(145deg, #F5E6D3, #FAF0E6);
        }

        .modern-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, #3E000C, #6B0015, #3E000C);
          border-radius: inherit;
          z-index: -1;
        }

        .tag-badge {
          background: linear-gradient(135deg, #3E000C, #6B0015);
          position: relative;
          overflow: hidden;
        }

        .tag-badge::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transform: rotate(45deg);
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Decorative shapes */}
      <div className="floating-shape" style={{ width: '300px', height: '300px', top: '10%', left: '-150px' }}></div>
      <div className="floating-shape" style={{ width: '200px', height: '200px', bottom: '20%', right: '-100px', animationDelay: '2s' }}></div>
      <div className="floating-shape" style={{ width: '150px', height: '150px', top: '40%', right: '10%', animationDelay: '1s' }}></div>
      <div className="floating-shape" style={{ width: '250px', height: '250px', bottom: '10%', left: '20%', animationDelay: '3s' }}></div>
      <div className="floating-shape" style={{ width: '180px', height: '180px', top: '60%', left: '10%', animationDelay: '4s' }}></div>
      <div className="floating-shape" style={{ width: '220px', height: '220px', top: '25%', right: '30%', animationDelay: '2.5s' }}></div>
      <div className="floating-shape" style={{ width: '160px', height: '160px', bottom: '35%', right: '25%', animationDelay: '1.5s' }}></div>
      <div className="floating-shape" style={{ width: '280px', height: '280px', top: '70%', right: '40%', animationDelay: '3.5s' }}></div>
      
      <div className="pulse-shape" style={{ width: '400px', height: '400px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
      <div className="pulse-shape" style={{ width: '300px', height: '300px', top: '20%', left: '60%', animationDelay: '2s' }}></div>
      <div className="pulse-shape" style={{ width: '350px', height: '350px', bottom: '30%', left: '30%', animationDelay: '3s' }}></div>
      <div className="pulse-shape" style={{ width: '250px', height: '250px', top: '80%', right: '20%', animationDelay: '1.5s' }}></div>
      <div className="pulse-shape" style={{ width: '200px', height: '200px', top: '35%', left: '15%', animationDelay: '4s' }}></div>
      
      {/* Additional subtle circles */}
      <div style={{ 
        position: 'absolute', 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%', 
        background: 'rgba(245, 230, 211, 0.05)',
        top: '15%', 
        left: '40%',
        animation: 'float 8s ease-in-out infinite'
      }}></div>
      <div style={{ 
        position: 'absolute', 
        width: '120px', 
        height: '120px', 
        borderRadius: '50%', 
        background: 'rgba(62, 0, 12, 0.05)',
        bottom: '25%', 
        left: '60%',
        animation: 'pulse 5s ease-in-out infinite'
      }}></div>
      <div style={{ 
        position: 'absolute', 
        width: '140px', 
        height: '140px', 
        borderRadius: '50%', 
        background: 'rgba(245, 230, 211, 0.08)',
        top: '45%', 
        right: '15%',
        animation: 'float 7s ease-in-out infinite',
        animationDelay: '2s'
      }}></div>
      <div style={{ 
        position: 'absolute', 
        width: '90px', 
        height: '90px', 
        borderRadius: '50%', 
        background: 'rgba(62, 0, 12, 0.06)',
        top: '65%', 
        left: '45%',
        animation: 'pulse 6s ease-in-out infinite',
        animationDelay: '1s'
      }}></div>
      <div style={{ 
        position: 'absolute', 
        width: '170px', 
        height: '170px', 
        borderRadius: '50%', 
        background: 'rgba(245, 230, 211, 0.06)',
        bottom: '45%', 
        right: '35%',
        animation: 'float 9s ease-in-out infinite',
        animationDelay: '3s'
      }}></div>

      <div className="relative z-10 px-5 pt-[150px] pb-[60px]">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="text-center mb-24">
            <h1 className="hero-text text-6xl md:text-8xl font-black mb-6 text-white leading-tight">
              Membership
              <span className="block text-transparent bg-clip-text" style={{ background: 'linear-gradient(135deg, #F5E6D3, #FFFFFF)', WebkitBackgroundClip: 'text' }}>
                Benefits
              </span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-gray-200 font-light max-w-3xl mx-auto leading-relaxed">
              Unlock exclusive discounts with your PPIA UNSW membership
            </p>
          </div>

          {/* Marquee */}
          <div className="marquee-container overflow-hidden relative my-[80px] py-6 glass-effect rounded-3xl">
            <div className="marquee flex w-fit">
              {[...benefits, ...benefits].map((benefit, index) => (
                <div key={index} className="flex-shrink-0 mx-8">
                  <div className="px-8 py-4 rounded-2xl glass-effect flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-md" 
                         style={{ 
                           backgroundColor: 'rgba(245, 230, 211, 0.2)',
                           border: '2px solid rgba(245, 230, 211, 0.5)'
                         }}>
                      <span className="text-white font-bold text-sm">{benefit.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="text-white font-semibold text-lg">{benefit.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Partners</h2>
              <p className="text-xl text-gray-200 mb-8">Exclusive discounts at these amazing venues</p>
              
              {!showBenefits && (
                <button
                  onClick={() => setShowBenefits(true)}
                  className="inline-flex items-center gap-3 px-10 py-4 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{ 
                    background: 'linear-gradient(135deg, #3E000C, #6B0015)',
                    boxShadow: '0 10px 30px rgba(62, 0, 12, 0.3)'
                  }}
                >
                  <span>View All Benefits</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            
            {showBenefits && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="benefit-card rounded-3xl p-8 cursor-pointer"
                      onMouseEnter={() => setHoveredBenefit(index)}
                      onMouseLeave={() => setHoveredBenefit(null)}
                      style={{ 
                        animation: 'fadeInUp 0.5s ease forwards',
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2" style={{ color: '#0D1F3D' }}>{benefit.name}</h3>
                          <span className="tag-badge inline-block px-4 py-2 rounded-full text-xs font-bold tracking-wider text-white uppercase">
                            Member Exclusive
                          </span>
                        </div>
                        <div className="w-16 h-16 ml-4 flex items-center justify-center rounded-lg" 
                             style={{ 
                               backgroundColor: '#F5E6D3',
                               border: '3px solid #3E000C',
                               transform: hoveredBenefit === index ? 'rotate(5deg) scale(1.1)' : 'rotate(0) scale(1)',
                               transition: 'transform 0.3s ease'
                             }}>
                          <span className="text-2xl font-bold" style={{ color: '#3E000C' }}>{benefit.name.charAt(0)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-5xl font-black gradient-text">
                          {benefit.discount}
                        </div>
                        <div className="p-4 rounded-2xl" style={{ 
                          background: 'rgba(62, 0, 12, 0.05)', 
                          borderLeft: '4px solid #3E000C',
                          color: '#333' 
                        }}>
                          <p className="text-sm font-medium">{benefit.condition}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-8">
                  <button
                    onClick={() => setShowBenefits(false)}
                    className="inline-flex items-center gap-2 px-8 py-3 text-gray-200 rounded-full font-medium text-sm transition-all duration-300 hover:text-white hover:scale-105"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>Hide Benefits</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Registration Section */}
          <div className="relative rounded-[40px] overflow-hidden" style={{ background: 'linear-gradient(145deg, #F5E6D3, #FAF0E6)' }}>
            {/* Header Bar */}
            <div className="relative py-8 px-12" style={{ background: 'linear-gradient(135deg, #3E000C, #6B0015)' }}>
              <h2 className="text-5xl md:text-6xl font-black text-white text-center tracking-tight">
                REGISTRATION
              </h2>
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
              }}></div>
            </div>

            {/* Content */}
            <div className="p-12">
              <div className="max-w-[900px] mx-auto">
                <div className="modern-border rounded-3xl p-10 mb-10" style={{ background: 'linear-gradient(135deg, #3E000C, #5A0010)' }}>
                  <p className="text-white text-xl mb-8 font-semibold">
                    To register as a new member of PPIA, follow these simple steps:
                  </p>
                  
                  <div className="space-y-6 mb-10">
                    {registrationSteps.map((step, index) => (
                      <div
                        key={index}
                        ref={el => { stepsRef.current[index] = el; }}
                        className="registration-step flex items-center gap-6 p-5 rounded-2xl glass-effect"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg" 
                             style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFF' }}>
                          {index + 1}
                        </div>
                        <p className="text-white text-lg flex-1">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-white text-lg leading-relaxed">
                      Alternatively, new members can register during <span className="font-bold">O-Week</span> at PPIA's annual booth. 
                      This booth offers a convenient opportunity to sign up on the spot and immediately receive your 
                      membership card and member number.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="https://www.instagram.com/ppiaunsw/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shimmer-button inline-flex items-center gap-3 px-12 py-5 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    style={{ 
                      background: 'linear-gradient(135deg, #3E000C, #6B0015)',
                      boxShadow: '0 10px 30px rgba(62, 0, 12, 0.3)'
                    }}
                  >
                    <span>Register via Instagram</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}