import { motion } from 'framer-motion';
import { Download, Github, Zap, Play } from 'lucide-react';
import { APP_VERSION, REPO_URL } from '../constants';
import logoUrl from '../assets/logo.svg';

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
      {/* Animated background */}
      <div className="hero-bg">
        <div className="hero-bg-gradient-1" />
        <div className="hero-bg-gradient-2" />
        <div className="hero-grid" />
      </div>

      <div className="hero-content">
        {/* Logo */}
        <motion.div
          variants={item}
          className="hero-logo-container"
        >
          <img src={logoUrl} alt="Transcoder Logo" className="hero-logo" />
        </motion.div>

        <motion.div variants={item} className="hero-badge">
          <Zap size={14} />
          <span>For Video Editors</span>
        </motion.div>

        <motion.h1 variants={item} className="hero-title">
          Transcoder
        </motion.h1>
        <motion.p variants={item} className="hero-subtitle">
          Convert videos to editing-friendly formats. ProRes, DNxHR ready for Adobe
          Premiere Pro and After Effects.
        </motion.p>
        <motion.div variants={item} className="hero-description">
          <span>Intent-driven transcoding — select your output format, we handle the rest</span>
        </motion.div>
        <motion.div variants={item} className="cta-buttons">
          <motion.a
            href="#download"
            className="btn btn-primary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={20} />
            Download v{APP_VERSION}
          </motion.a>
          <motion.a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Github size={20} />
            View on GitHub
          </motion.a>
          <motion.a
            href="#features"
            className="btn btn-ghost"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play size={20} />
            Learn More
          </motion.a>
        </motion.div>
      </div>

      <style>{`
        .hero {
          position: relative;
          background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
          color: white;
          padding: 5rem 2rem 6rem;
          text-align: center;
          overflow: hidden;
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .hero-bg-gradient-1 {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
        }
        .hero-bg-gradient-2 {
          position: absolute;
          bottom: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(74, 163, 192, 0.2) 0%, transparent 50%);
          animation: float 15s ease-in-out infinite reverse;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 30s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        .hero-logo-container {
          width: 140px;
          height: 140px;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-logo {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2));
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          backdrop-filter: blur(8px);
        }
        .hero-title {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }
        .hero-subtitle {
          font-size: 1.35rem;
          opacity: 0.95;
          max-width: 600px;
          margin: 0 auto 1rem;
          line-height: 1.5;
        }
        .hero-description {
          font-size: 1rem;
          opacity: 0.8;
          max-width: 500px;
          margin: 0 auto 2.5rem;
        }
        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-ghost {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
        }
        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @media (max-width: 768px) {
          .hero {
            padding: 3rem 1rem 4rem;
            min-height: 80vh;
          }
          .hero-logo-container {
            width: 100px;
            height: 100px;
          }
          .hero-title {
            font-size: 2.25rem;
          }
          .hero-subtitle {
            font-size: 1.1rem;
          }
          .hero-description {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </motion.section>
  );
}
