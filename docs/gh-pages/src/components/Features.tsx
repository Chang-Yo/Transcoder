import { motion } from 'framer-motion';
import { Zap, Film, Layers, Settings, FileEdit, HardDrive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: 'Intent-Driven',
    description:
      'Select "I want to edit" — no need to understand encoding parameters. The tool handles everything automatically.',
  },
  {
    icon: Film,
    title: 'Editor-Friendly',
    description:
      'Output works directly in Adobe Premiere Pro and After Effects. No re-wrapping, no codec issues.',
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    description:
      'Queue multiple files and transcode them in parallel. Real-time progress tracking for each file.',
  },
  {
    icon: Settings,
    title: 'Smart Defaults',
    description:
      '10-bit preservation, framerate matching, automatic audio conversion to PCM or AAC.',
  },
  {
    icon: FileEdit,
    title: 'Custom Filenames',
    description:
      'Edit output filenames before transcoding. Suffix and extension auto-managed by preset.',
  },
  {
    icon: HardDrive,
    title: 'Size Estimation',
    description: 'See estimated output size before transcoding. Plan your storage accordingly.',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      className="feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="feature-icon-wrapper"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <Icon className="feature-icon" size={32} strokeWidth={2} />
      </motion.div>
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-desc">{feature.description}</p>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Why Transcoder?</h2>
        <p className="section-subtitle">
          Designed for video editors who need reliable, editable footage without the
          complexity of FFmpeg.
        </p>
      </motion.div>
      <div className="features">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>

      <style>{`
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .feature-card {
          background: var(--surface);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--border);
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .feature-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }
        .feature-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .feature-icon {
          color: white;
        }
        .feature-title {
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 1.15rem;
          color: var(--text);
        }
        .feature-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
