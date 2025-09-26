import { useEffect, useRef } from 'react';

export default function MembershipBenefits() {
  const stepsRef = useRef<(HTMLLIElement | null)[]>([]);

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
      logo: ""
    },
    {
      name: "SHARE TEA",
      discount: "FREE UPSIZE",
      condition: "Only at Haymarket Branch",
      logo: ""
    },
    {
      name: "Kirribilli Pizzeria",
      discount: "10% OFF",
      condition: "Order in, for purchases over $30",
      logo: ""
    },
    {
      name: "The Sambal",
      discount: "10% OFF",
      condition: "On all dine-in and takeaway orders",
      logo: ""
    },
    {
      name: "The Bowls",
      discount: "15% OFF",
      condition: "On all menu items",
      logo: ""
    },
    {
      name: "Mie Kocok Bandung",
      discount: "10% OFF",
      condition: "On main Courses, Dine in only",
      logo: ""
    }
  ];

  const registrationSteps = [
    "Reach out to us via email or Instagram.",
    "Complete the registration form provided.",
    "Proceed with the payment process.",
    "Receive your PPIA membership card and member number."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white px-5 py-20 relative overflow-x-hidden">
      <style>{`
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

        @keyframes popUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .registration-step {
          opacity: 0;
          animation: popUp 0.6s ease forwards;
        }

        .registration-step.visible {
          opacity: 1;
        }

        .registration-step:nth-child(1) { animation-delay: 0.1s; }
        .registration-step:nth-child(2) { animation-delay: 0.2s; }
        .registration-step:nth-child(3) { animation-delay: 0.3s; }
        .registration-step:nth-child(4) { animation-delay: 0.4s; }

        .benefit-card {
          transition: all 0.4s ease;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        }

        .benefit-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(59, 130, 246, 0.1));
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: 1.5rem;
        }

        .benefit-card:hover::before {
          opacity: 1;
        }

        .benefit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        }

        .gradient-text {
          background: linear-gradient(135deg, #ef4444 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-button {
          background: linear-gradient(135deg, #ef4444 0%, #3b82f6 100%);
          position: relative;
          overflow: hidden;
        }

        .gradient-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .gradient-button:hover::before {
          left: 100%;
        }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-black mb-5">
            <span className="gradient-text">Membership Benefits</span>
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Unlock exclusive discounts with your PPIA UNSW membership
          </p>
        </div>

        {/* Marquee */}
        <div className="marquee-container overflow-hidden relative my-16 py-8 bg-white/[0.02] border-t border-b border-white/10 rounded-2xl">
          <div className="marquee flex w-fit">
            {[...benefits, ...benefits].map((benefit, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-40 h-20 mx-10 flex items-center justify-center bg-white/5 rounded-xl p-5 border border-white/10"
              >
                <span className="text-white/70 font-medium">{benefit.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-card backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{benefit.name}</h3>
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-full text-sm font-semibold tracking-wide border border-white/10">
                    MEMBER EXCLUSIVE
                  </span>
                </div>
                <div className="text-4xl font-black mb-4 gradient-text">
                  {benefit.discount}
                </div>
                <div className="text-gray-400 text-sm leading-relaxed p-3 bg-white/[0.02] rounded-xl border-l-2 border-blue-500/50">
                  {benefit.condition}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Registration Section */}
        <div className="text-center p-12 bg-gradient-to-r from-red-500/10 to-blue-500/10 rounded-3xl border border-white/10 backdrop-blur-md">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 gradient-text">REGISTRATION</h2>
          <div className="text-left max-w-3xl mx-auto mb-10">
            <p className="text-white text-xl mb-6 font-semibold">
              To register as a new member of PPIA, follow these simple steps:
            </p>
            <ol className="text-white text-lg leading-relaxed mb-8 pl-10 list-none space-y-4">
              {registrationSteps.map((step, index) => (
                <li
                  key={index}
                  ref={el => stepsRef.current[index] = el}
                  className="registration-step relative pl-8 py-2 bg-white/[0.02] rounded-lg border-l-2 border-blue-500/50"
                >
                  <span className="absolute left-[-20px] w-8 h-8 bg-gradient-to-r from-red-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-white/80 text-lg leading-relaxed">
              Alternatively, new members can register during O-Week at PPIA's annual booth. This booth offers a convenient opportunity to sign up on the spot and immediately receive your membership card and member number.
            </p>
          </div>
          <a
            href="https://www.instagram.com/ppiaunsw/"
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-button inline-block px-12 py-4 text-white rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
          >
            Register via Instagram
          </a>
        </div>
      </div>
    </div>
  );
}