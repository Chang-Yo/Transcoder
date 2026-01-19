import { motion } from 'framer-motion';
import { Github, FileText, AlertCircle } from 'lucide-react';
import { CHANGELOG_URL, ISSUES_URL, REPO_URL } from '../constants';

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
        <p className="footer-copyright">
          Released under the Apache License 2.0. Built with Tauri + Rust + TypeScript.
        </p>
      </div>

      <style>{`
        .footer {
          background: var(--secondary);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-links {
          display: flex;
          gap: 2rem;
          justify-content: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .footer-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
          position: relative;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: white;
          transition: width 0.2s;
        }
        .footer-link:hover {
          color: white;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-copyright {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
        }
        @media (max-width: 768px) {
          .footer-links {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </footer>
  );
}
