import { useEffect, useState } from "react";

const AcknowledgmentPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const teamMembers = [
    { id: 1, name: 'John Doe', role: 'Backend Developer', stream: 'backend', avatar: 'JD' },
    { id: 2, name: 'John Doe', role: 'Backend Developer', stream: 'backend', avatar: 'JD' },
    { id: 3, name: 'John Doe', role: 'Backend Developer', stream: 'backend', avatar: 'JD' },
    { id: 4, name: 'John Doe', role: 'Backend Developer', stream: 'backend', avatar: 'JD' },
    { id: 5, name: 'John Doe', role: 'Frontend Developer', stream: 'frontend', avatar: 'JD' },
    { id: 6, name: 'John Doe', role: 'Frontend Developer', stream: 'frontend', avatar: 'JD' },
    { id: 7, name: 'John Doe', role: 'Frontend Developer', stream: 'frontend', avatar: 'JD' },
    { id: 8, name: 'John Doe', role: 'Frontend Developer', stream: 'frontend', avatar: 'JD' },
    { id: 9, name: 'John Doe', role: 'UI/UX Designer', stream: 'uiux', avatar: 'JD' },
    { id: 10, name: 'John Doe', role: 'UI/UX Designer', stream: 'uiux', avatar: 'JD' },
    { id: 11, name: 'John Doe', role: 'UI/UX Designer', stream: 'uiux', avatar: 'JD' },
  ];

  const filteredMembers = activeFilter === 'all'
    ? teamMembers
    : teamMembers.filter(member => member.stream === activeFilter);

  useEffect(() => {
    // Create matrix rain effect
    const matrixBg = document.getElementById('matrixBg');
    const columns = Math.floor(window.innerWidth / 50);
    const characters = 'PPIA';

    if (matrixBg) {
      // Clear any existing columns
      matrixBg.innerHTML = '';

      for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = `${i * 50}px`;
        column.style.animationDuration = `${Math.random() * 10 + 10}s`;
        column.style.animationDelay = `${Math.random() * 10}s`;

        let text = '';
        for (let j = 0; j < 30; j++) {
          text += characters[Math.floor(Math.random() * characters.length)] + ' ';
        }
        column.textContent = text;

        matrixBg.appendChild(column);
      }
    }

    // Smooth scroll animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.style.animation = element.style.animation || 'slideIn 0.6s forwards';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.timeline-item, .bento-card').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #3E000C;
          --secondary: #7C0B2B;
          --accent: #8B1538;
          --light: #F5E6D3;
          --dark: #0a0508;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--dark);
          color: var(--light);
          overflow-x: hidden;
          position: relative;
        }

        .acknowledgment-container {
          margin: -9rem -5rem 0 -5rem !important;
          padding: 0 !important;
        }


        /* Matrix rain effect background */
        .matrix-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          opacity: 0.05;
        }

        .matrix-column {
          position: absolute;
          top: -100%;
          font-family: monospace;
          font-size: 20px;
          color: var(--accent);
          animation: matrix-fall linear infinite;
          writing-mode: vertical-rl;
          text-orientation: upright;
        }

        @keyframes matrix-fall {
          to {
            transform: translateY(200vh);
          }
        }

        /* Hero section */
        .hero {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          background: radial-gradient(ellipse at center, var(--primary) 0%, var(--dark) 100%);
          scroll-snap-align: start;
        }

        .hero-title {
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.05em;
          line-height: 0.9;
          position: relative;
          z-index: 2;
        }

        .hero-title span {
          display: block;
          background: linear-gradient(45deg, var(--light), var(--accent), var(--light));
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          width: 30px;
          height: 50px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          display: flex;
          justify-content: center;
          padding-top: 10px;
        }

        .scroll-indicator::before {
          content: '';
          width: 4px;
          height: 10px;
          background: var(--light);
          border-radius: 2px;
          animation: scroll-bounce 2s infinite;
        }

        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(10px); opacity: 0.5; }
        }

        /* Timeline section */
        .timeline-section {
          padding: 100px 20px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          scroll-snap-align: start;
          min-height: 100vh;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-header h2 {
          font-size: 3rem;
          margin-bottom: 20px;
          position: relative;
          display: inline-block;
        }

        .section-header h2::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
        }

        .filter-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 60px;
          flex-wrap: wrap;
        }

        .filter-button {
          padding: 12px 24px;
          border: 2px solid var(--accent);
          background: transparent;
          color: var(--light);
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
        }

        .filter-button:hover {
          background: var(--accent);
          color: var(--dark);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(139, 58, 98, 0.4);
        }

        .filter-button.active {
          background: var(--accent);
          color: var(--dark);
        }

        .timeline {
          position: relative;
          padding: 0 50px;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, var(--accent), transparent);
        }

        .timeline-item {
          display: flex;
          justify-content: flex-end;
          padding-right: calc(50% + 40px);
          position: relative;
          margin-bottom: 60px;
          opacity: 0;
          transform: translateX(-50px);
          animation: slideIn 0.6s forwards;
        }

        .timeline-item:nth-child(even) {
          justify-content: flex-start;
          padding-right: 0;
          padding-left: calc(50% + 40px);
          transform: translateX(50px);
        }

        .timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .timeline-item:nth-child(4) { animation-delay: 0.4s; }
        .timeline-item:nth-child(5) { animation-delay: 0.5s; }
        .timeline-item:nth-child(6) { animation-delay: 0.6s; }
        .timeline-item:nth-child(7) { animation-delay: 0.7s; }
        .timeline-item:nth-child(8) { animation-delay: 0.8s; }
        .timeline-item:nth-child(9) { animation-delay: 0.9s; }
        .timeline-item:nth-child(10) { animation-delay: 1.0s; }
        .timeline-item:nth-child(11) { animation-delay: 1.1s; }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .timeline-dot {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          background: var(--accent);
          border: 4px solid var(--dark);
          border-radius: 50%;
          z-index: 1;
        }

        .timeline-content {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          max-width: 400px;
          width: 100%;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .timeline-content::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .timeline-content:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 50px rgba(139, 58, 98, 0.4);
        }

        .timeline-content:hover::before {
          opacity: 1;
        }

        .member-avatar {
          width: 80px;
          height: 80px;
          background: var(--dark);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }

        .member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 15px;
        }

        .member-info h3 {
          font-size: 1.5rem;
          margin-bottom: 5px;
        }

        .member-role {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 15px;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .member-contribution {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        /* Bento grid section */
        .bento-section {
          padding: 100px 20px;
          background: linear-gradient(180deg, var(--dark), var(--primary), var(--dark));
          scroll-snap-align: start;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .bento-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px;
          position: relative;
          overflow: hidden;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .bento-card.large {
          grid-column: span 2;
          grid-row: span 2;
          min-height: 400px;
        }

        .bento-card h3 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: var(--accent);
        }

        .bento-card p {
          font-size: 1.1rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Footer */
        .footer {
          padding: 60px 20px;
          text-align: center;
          background: var(--dark);
          position: relative;
        }

        .footer-attribution {
          color: var(--accent);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .hero-title {
            font-size: clamp(2rem, 15vw, 4rem);
          }

          .filter-buttons {
            gap: 10px;
            margin-bottom: 40px;
          }

          .filter-button {
            padding: 8px 16px;
            font-size: 0.8rem;
          }

          .timeline::before {
            left: 30px;
          }

          .timeline-item {
            padding-left: 80px !important;
            padding-right: 20px !important;
          }

          .timeline-item:nth-child(even) {
            padding-left: 80px !important;
          }

          .timeline-dot {
            left: 30px;
          }

          .timeline-content {
            max-width: 100%;
          }

          .bento-card.large {
            grid-column: span 1;
            grid-row: span 1;
          }
        }
      `}</style>

      <div className="acknowledgment-container" style={{ boxSizing: 'border-box' }}>
        {/* Matrix background */}
        <div className="matrix-bg" id="matrixBg"></div>

        {/* Hero Section */}
        <section className="hero">
          <h1 className="hero-title">
            <span>BUILT BY</span>
            <span>PPIA IT TEAM</span>
          </h1>
          <div className="scroll-indicator"></div>
        </section>

        {/* Timeline Section */}
        <section className="timeline-section">
          <div className="section-header">
            <h2>The Architects</h2>
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Team
            </button>
            <button
              className={`filter-button ${activeFilter === 'backend' ? 'active' : ''}`}
              onClick={() => setActiveFilter('backend')}
            >
              Backend
            </button>
            <button
              className={`filter-button ${activeFilter === 'frontend' ? 'active' : ''}`}
              onClick={() => setActiveFilter('frontend')}
            >
              Frontend
            </button>
            <button
              className={`filter-button ${activeFilter === 'uiux' ? 'active' : ''}`}
              onClick={() => setActiveFilter('uiux')}
            >
              UI/UX
            </button>
          </div>

          <div className="timeline">
            {filteredMembers.map((member, index) => (
              <div key={member.id} className="timeline-item" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="member-avatar">{member.avatar}</div>
                  <div className="member-info">
                    <h3>{member.name}</h3>
                    <div className="member-role">{member.role}</div>
                    <div className="member-contribution">
                      Contributed to the development of the PPIA platform
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="bento-section">
          <div className="bento-grid">
            <div className="bento-card large">
              <h3>Special Thanks</h3>
              <p>
                We extend our heartfelt gratitude to <strong>Winston Tjay</strong>, 2024-2025 PPIA President,
                for giving us the opportunity to build this platform for the Indonesian community.
                Special thanks to <strong>Brandon Setiadi</strong> and <strong>Jesselyne Gratia</strong>
                for their invaluable guidance and mentorship.
                <br /><br />
                We also thank <strong>UNSW</strong> and <strong>Arc</strong> for providing us with
                the resources and platform to foster the Indonesian community on campus.
                Your continued support has been instrumental in bringing this platform to life,
                creating a lasting impact on our community.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-attribution">
            Built with ❤️ by PPIA UNSW IT Team
          </div>
        </footer>
      </div>
    </>
  );
};

export { AcknowledgmentPage };