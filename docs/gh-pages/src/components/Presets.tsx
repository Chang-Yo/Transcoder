import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Preset {
  name: string;
  recommended: boolean;
  specs: string;
  bitrate: string;
  description: string;
  useCase: string;
}

const presets: Preset[] = [
  {
    name: 'ProRes 422',
    recommended: true,
    specs: '10-bit · 4:2:2 · PCM',
    bitrate: '~147 Mbps @ 1080p',
    description: 'Main editing format, intra-frame compression. Best balance of quality and file size.',
    useCase: 'Recommended for most projects',
  },
  {
    name: 'ProRes 422 LT',
    recommended: false,
    specs: '10-bit · 4:2:2 · PCM',
    bitrate: '~102 Mbps @ 1080p',
    description: 'Lower bitrate option when disk space is a concern.',
    useCase: 'Storage-constrained workflows',
  },
  {
    name: 'ProRes 422 Proxy',
    recommended: false,
    specs: '8-bit · 4:2:0 · AAC',
    bitrate: '~36 Mbps @ 1080p',
    description: 'Low-bitrate proxy for offline editing. Final output replaced with high-quality files.',
    useCase: 'Offline editing, temporary proxies',
  },
  {
    name: 'DNxHR HQX',
    recommended: false,
    specs: '10-bit · 4:2:2 · PCM',
    bitrate: '~295 Mbps @ 1080p',
    description: 'Avid format, Windows-friendly alternative to ProRes. Higher quality, larger files.',
    useCase: 'Windows-based workflows',
  },
  {
    name: 'H.264 CRF 18',
    recommended: false,
    specs: '8-bit · 4:2:0 · AAC',
    bitrate: 'Variable (CRF 18)',
    description: 'High quality H.264 for web sharing. Not ideal for editing due to GOP structure.',
    useCase: 'Web sharing, final delivery',
  },
];

function PresetCard({ preset }: { preset: Preset }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`preset-card ${preset.recommended ? 'preset-card-recommended' : ''}`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => setExpanded(!expanded)}
      layout
    >
      {preset.recommended && (
        <motion.div
          className="preset-badge"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          Recommended
        </motion.div>
      )}
      <h3 className="preset-name">{preset.name}</h3>
      <p className="preset-specs">{preset.specs}</p>
      <p className="preset-bitrate">{preset.bitrate}</p>

      <motion.div
        className="preset-details"
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="preset-details-inner">
          <p className="preset-description">{preset.description}</p>
          <p className="preset-use-case">
            <strong>Best for:</strong> {preset.useCase}
          </p>
        </div>
      </motion.div>

      <motion.button
        className="preset-expand"
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown size={18} />
      </motion.button>
    </motion.div>
  );
}

export function Presets() {
  return (
    <section id="presets" className="section">
      <h2 className="section-title">Output Presets</h2>
      <p className="section-subtitle">
        Choose the right format for your workflow. All presets maintain timeline
        scrubbing performance.
      </p>
      <div className="presets">
        {presets.map((preset) => (
          <PresetCard key={preset.name} preset={preset} />
        ))}
      </div>

      <style>{`
        .presets {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          align-items: start;
        }
        .preset-card {
          background: var(--surface);
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid var(--border);
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: border-color 0.2s;
          overflow: hidden;
        }
        .preset-card:hover {
          border-color: var(--primary);
        }
        .preset-card-recommended {
          border-color: var(--primary);
        }
        .preset-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary);
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 600;
        }
        .preset-name {
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        .preset-specs {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        .preset-bitrate {
          color: var(--primary);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .preset-details {
          overflow: hidden;
          margin-top: 0.5rem;
        }
        .preset-details-inner {
          padding-top: 1rem;
          border-top: 1px solid var(--border);
          text-align: left;
        }
        .preset-description {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .preset-use-case {
          font-size: 0.85rem;
          color: var(--text);
        }
        .preset-expand {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem;
          color: var(--text-muted);
          background: transparent;
        }
      `}</style>
    </section>
  );
}
