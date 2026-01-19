import { motion } from 'framer-motion';
import { Github, FileText, AlertCircle, Heart } from 'lucide-react';
import { CHANGELOG_URL, ISSUES_URL, REPO_URL } from '../constants';
import logoUrl from '../assets/logo.svg';

const footerLinks = [
  { href: REPO_URL, label: 'GitHub', icon: <Github size={16} /> },
  { href: CHANGELOG_URL, label: 'Changelog', icon: <FileText size={16} /> },
  {
    href: ISSUES_URL,
    label: 'Report Issue',
    icon: <AlertCircle size={16} />,
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Logo section */}
        <motion.div
          className="footer-logo"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <img src={logoUrl} alt="Transcoder" className="footer-logo-img" />
          <div className="footer-brand">
            <h3 className="footer-brand-name">Transcoder</h3>
            <p className="footer-brand-tagline">Professional video transcoding for editors</p>
          </div>
        </motion.div>

        {/* Links section */}
        <div className="footer-links">
          {footerLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="footer-link"
              whileHover={{ y: -2 }}
            >
              {link.icon}
              <span>{link.label}</span>
            </motion.a>
          ))}
        </div>

        {/* Copyright section */}
        <p className="footer-copyright">
          <span>Released under the Apache License 2.0. </span>
          <span className="footer-separator">•</span>
          <span> Built with </span>
          <span className="footer-tech">Tauri + Rust + TypeScript</span>
        </p>

        {/* Made with love */}
        <p className="footer-love">
          Made with <Heart size={12} className="heart-icon" fill="currentColor" /> for video editors
        </p>
      </div>

      <style>{`
        .footer {
          background: linear-gradient(180deg, var(--secondary) 0%, #0d0d0d 100%);
          color: white;
          padding: 4rem 2rem 2rem;
          text-align: center;
        }
        [data-theme='dark'] .footer {
          background: linear-gradient(180deg, var(--surface) 0%, #0a0d14 100%);
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .footer-logo-img {
          width: 48px;
          height: 48px;
        }
        .footer-brand {
          text-align: left;
        }
        .footer-brand-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .footer-brand-tagline {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .footer-links {
          display: flex;
          gap: 2rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .footer-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
          position: relative;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }
        .footer-link:hover {
          color: var(--primary-light);
          background: rgba(255, 255, 255, 0.05);
        }
        .footer-copyright {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .footer-separator {
          color: rgba(255, 255, 255, 0.2);
        }
        .footer-tech {
          color: var(--primary-light);
          font-weight: 500;
        }
        .footer-love {
          margin-top: 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }
        .heart-icon {
          color: #ef4444;
        }
        @media (max-width: 768px) {
          .footer {
            padding: 3rem 1.5rem 2rem;
          }
          .footer-logo {
            flex-direction: column;
            gap: 0.75rem;
          }
          .footer-brand {
            text-align: center;
          }
          .footer-links {
            flex-direction: column;
            gap: 0.5rem;
          }
          .footer-link {
            justify-content: center;
          }
          .footer-copyright {
            flex-direction: column;
            gap: 0.25rem;
          }
          .footer-separator {
            display: none;
          }
        }
      `}</style>
    </footer>
  );
}
