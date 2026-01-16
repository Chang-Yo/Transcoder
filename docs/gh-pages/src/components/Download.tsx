import { motion } from 'framer-motion';
import { Download as DownloadIcon, ExternalLink, Check, Package, HardDrive } from 'lucide-react';

interface Requirement {
  id: string;
  icon: React.ReactNode;
  text: string;
}

const requirements: Requirement[] = [
  { id: 'windows', icon: <Check size={18} />, text: 'Windows 10 or later (64-bit)' },
  { id: 'no-install', icon: <Check size={18} />, text: 'No installation required' },
  { id: 'ffmpeg', icon: <Check size={18} />, text: 'FFmpeg bundled' },
  { id: 'disk-space', icon: <Check size={18} />, text: '~100MB disk space' },
];

export function Download() {
  return (
    <section id="download" className="section">
      <div className="download-content">
        <h2 className="section-title">Download</h2>
        <p className="section-subtitle">
          Windows only. Requires no installation — just extract and run.
        </p>

        <motion.div
          className="download-box"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <motion.a
            href="https://github.com/Chang-Yo/Transcoder/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="download-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <DownloadIcon size={24} />
            <div className="download-text">
              <span className="download-version">Download v0.6.0</span>
              <span className="download-meta">Windows • Portable</span>
            </div>
            <ExternalLink size={20} className="download-icon" />
          </motion.a>

          <p className="download-note">
            <Package size={16} />
            Includes bundled FFmpeg — no external dependencies required.
          </p>
        </motion.div>

        <div className="requirements">
          <h3 className="requirements-title">
            <HardDrive size={20} />
            System Requirements
          </h3>
          <ul className="requirements-list">
            {requirements.map((req, index) => (
              <motion.li
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="req-icon">{req.icon}</span>
                {req.text}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .download-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .download-box {
          background: var(--surface);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid var(--border);
          text-align: center;
        }
        .download-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--primary);
          color: white;
          padding: 1.25rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: box-shadow 0.2s;
          justify-content: center;
          width: 100%;
        }
        .download-btn:hover {
          box-shadow: 0 8px 24px rgba(57, 108, 216, 0.4);
        }
        .download-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        .download-version {
          font-size: 1.1rem;
        }
        .download-meta {
          font-size: 0.85rem;
          opacity: 0.8;
        }
        .download-icon {
          opacity: 0.7;
        }
        .download-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .requirements {
          margin-top: 3rem;
          background: var(--surface);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid var(--border);
        }
        .requirements-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .requirements-list {
          list-style: none;
        }
        .requirements-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          color: var(--text-muted);
        }
        .req-icon {
          color: #10b981;
          display: flex;
          align-items: center;
        }
      `}</style>
    </section>
  );
}
