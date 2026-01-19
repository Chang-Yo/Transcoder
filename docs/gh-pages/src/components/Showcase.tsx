import { motion } from 'framer-motion';
import { Monitor, Cpu, HardDrive, Zap } from 'lucide-react';

const showcaseItems = [
  {
    icon: Monitor,
    title: 'Clean Interface',
    description: 'Intuitive drag-and-drop interface designed for efficiency',
  },
  {
    icon: Cpu,
    title: 'Fast Processing',
    description: 'Leverages FFmpeg for optimized transcoding performance',
  },
  {
    icon: HardDrive,
    title: 'Portable',
    description: 'No installation required — just extract and run',
  },
  {
    icon: Zap,
    title: 'Real-time Progress',
    description: 'Track individual and batch transcoding progress',
  },
];

export function Showcase() {
  return (
    <section className="showcase-section">
      <div className="section-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="showcase-header"
        >
          <h2 className="showcase-title">Built for Professionals</h2>
          <p className="showcase-subtitle">
            Every feature designed with the video editor's workflow in mind
          </p>
        </motion.div>

        <div className="showcase-preview">
          <motion.div
            className="app-preview"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="preview-window">
              <div className="preview-titlebar">
                <div className="preview-controls">
                  <span className="preview-dot preview-dot-red" />
                  <span className="preview-dot preview-dot-yellow" />
                  <span className="preview-dot preview-dot-green" />
                </div>
                <span className="preview-title">Transcoder</span>
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="preview-section">Output Format</div>
                  <div className="preview-grid">
                    <div className="preview-preset preview-preset-active">ProRes 422</div>
                    <div className="preview-preset">ProRes LT</div>
                    <div className="preview-preset">Proxy</div>
                    <div className="preview-preset">DNxHR</div>
                    <div className="preview-preset">H.264</div>
                  </div>
                  <div className="preview-section" style={{ marginTop: '1rem' }}>Output Directory</div>
                  <div className="preview-input" />
                  <div className="preview-section" style={{ marginTop: '1rem' }}>Est. Size: ~1.2 GB</div>
                  <div className="preview-btn">Start Transcoding</div>
                </div>
                <div className="preview-main">
                  <div className="preview-header">Queue (3 files)</div>
                  <div className="preview-file">
                    <div className="preview-file-icon" />
                    <div className="preview-file-info">
                      <div className="preview-file-name">video_001.mp4</div>
                      <div className="preview-file-meta">0:00 - 2:30 · ProRes 422</div>
                    </div>
                    <div className="preview-file-size">~450 MB</div>
                  </div>
                  <div className="preview-file">
                    <div className="preview-file-icon" />
                    <div className="preview-file-info">
                      <div className="preview-file-name">footage_a.mov</div>
                      <div className="preview-file-meta">Full · ProRes 422</div>
                    </div>
                    <div className="preview-file-size">~680 MB</div>
                  </div>
                  <div className="preview-file">
                    <div className="preview-file-icon" />
                    <div className="preview-file-info">
                      <div className="preview-file-name">clip_final.mp4</div>
                      <div className="preview-file-meta">0:30 - 1:45 · ProRes 422</div>
                    </div>
                    <div className="preview-file-size">~120 MB</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="showcase-features">
            {showcaseItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="showcase-feature"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="showcase-feature-icon">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="showcase-feature-title">{item.title}</h3>
                  <p className="showcase-feature-desc">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .showcase-section {
          background: var(--bg);
          padding: 6rem 2rem;
        }
        .section-content {
          max-width: 1200px;
          margin: 0 auto;
        }
        .showcase-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .showcase-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text);
        }
        .showcase-subtitle {
          color: var(--text-muted);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        .showcase-preview {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 4rem;
          align-items: center;
        }
        .app-preview {
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15));
        }
        .preview-window {
          background: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .preview-titlebar {
          background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .preview-controls {
          display: flex;
          gap: 0.5rem;
        }
        .preview-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .preview-dot-red { background: #ff5f57; }
        .preview-dot-yellow { background: #ffbd2e; }
        .preview-dot-green { background: #28c940; }
        .preview-title {
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .preview-content {
          display: flex;
          height: 320px;
        }
        .preview-sidebar {
          width: 260px;
          background: var(--bg);
          padding: 1rem;
          border-right: 1px solid var(--border);
        }
        .preview-main {
          flex: 1;
          padding: 1rem;
          background: var(--surface);
        }
        .preview-section {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        .preview-preset {
          padding: 0.5rem;
          font-size: 0.7rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
          color: var(--text-muted);
        }
        .preview-preset-active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .preview-input {
          height: 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .preview-btn {
          margin-top: 1rem;
          padding: 0.6rem;
          background: var(--primary);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          text-align: center;
          font-weight: 500;
        }
        .preview-header {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 1rem;
        }
        .preview-file {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg);
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        .preview-file-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border-radius: 6px;
        }
        .preview-file-info {
          flex: 1;
        }
        .preview-file-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text);
        }
        .preview-file-meta {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .preview-file-size {
          font-size: 0.7rem;
          color: var(--primary);
          font-weight: 500;
        }
        .showcase-features {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .showcase-feature {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .showcase-feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .showcase-feature-title {
          font-weight: 600;
          color: var(--text);
          margin-bottom: 0.25rem;
        }
        .showcase-feature-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        @media (max-width: 900px) {
          .showcase-preview {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .preview-content {
            height: 280px;
          }
          .preview-sidebar {
            width: 200px;
          }
        }
        @media (max-width: 600px) {
          .showcase-title {
            font-size: 1.75rem;
          }
          .preview-content {
            height: auto;
            flex-direction: column;
          }
          .preview-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
        }
      `}</style>
    </section>
  );
}
