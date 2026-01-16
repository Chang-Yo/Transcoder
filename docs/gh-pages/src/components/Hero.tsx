import { motion } from 'framer-motion';
import { Download, Github } from 'lucide-react';

export function Hero() {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <motion.section
      className="hero"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={item} className="hero-title">
        Editing Transcoder
      </motion.h1>
      <motion.p variants={item} className="hero-subtitle">
        Convert videos to editing-friendly formats. ProRes, DNxHR ready for Adobe
        Premiere Pro and After Effects.
      </motion.p>
      <motion.div variants={item} className="cta-buttons">
        <motion.a
          href="#download"
          className="btn btn-primary"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download size={20} />
          Download v0.6.0
        </motion.a>
        <motion.a
          href="https://github.com/Chang-Yo/Transcoder"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Github size={20} />
          View on GitHub
        </motion.a>
      </motion.div>

      {/* Animated background gradient */}
      <div className="hero-bg" />

      <style>{`
        .hero {
          position: relative;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          padding: 6rem 2rem;
          text-align: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);
          animation: pulse 8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .hero-title {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 800;
          position: relative;
          z-index: 1;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 2rem;
          position: relative;
          z-index: 1;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2rem; }
          .hero-subtitle { font-size: 1rem; }
          .hero { padding: 4rem 1rem; }
        }
      `}</style>
    </motion.section>
  );
}
