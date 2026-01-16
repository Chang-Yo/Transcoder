import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#presets', label: 'Presets' },
  { href: '#faq', label: 'FAQ' },
  { href: '#download', label: 'Download' },
  { href: 'https://github.com/Chang-Yo/Transcoder', label: 'GitHub', external: true },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <motion.a
            href="#"
            className="logo"
            whileHover={{ scale: 1.05 }}
            onClick={(e) => handleNavClick(e, '#')}
          >
            Editing Transcoder
          </motion.a>

          <nav className="nav-desktop">
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={(e) => handleNavClick(e, item.href)}
                whileHover={{ y: -2 }}
                className="nav-link"
              >
                {item.label}
              </motion.a>
            ))}
            <ThemeToggle />
          </nav>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <motion.nav
          className="nav-mobile"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {navItems.map((item, index) => (
            <motion.a
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              onClick={(e) => handleNavClick(e, item.href)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {item.label}
            </motion.a>
          ))}
          <div style={{ padding: '0.5rem 1rem' }}>
            <ThemeToggle />
          </div>
        </motion.nav>
      )}

      <style>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border);
          padding: 1rem 2rem;
          background: var(--surface);
          backdrop-filter: blur(8px);
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--primary);
        }
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-link {
          color: var(--text-muted);
          position: relative;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--primary);
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--primary);
          transition: width 0.2s;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .mobile-menu-btn {
          display: none;
          padding: 0.5rem;
          color: var(--text);
        }
        .nav-mobile {
          display: none;
          flex-direction: column;
          padding: 1rem 2rem;
          gap: 0.5rem;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .nav-mobile a {
          padding: 0.75rem 1rem;
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .nav-mobile a:hover {
          color: var(--primary);
        }
        @media (max-width: 768px) {
          .nav-desktop {
            display: none;
          }
          .mobile-menu-btn {
            display: flex;
          }
          .nav-mobile {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
