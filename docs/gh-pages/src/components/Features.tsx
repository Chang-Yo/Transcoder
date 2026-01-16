import { motion } from 'framer-motion';

const features = [
  {
    icon: '⚡',
    title: 'Intent-Driven',
    description:
      'Select "I want to edit" — no need to understand encoding parameters. The tool handles everything automatically.',
  },
  {
    icon: '🎬',
    title: 'Editor-Friendly',
    description:
      'Output works directly in Adobe Premiere Pro and After Effects. No re-wrapping, no codec issues.',
  },
  {
    icon: '📦',
    title: 'Batch Processing',
    description:
      'Queue multiple files and transcode them in parallel. Real-time progress tracking for each file.',
  },
  {
    icon: '🎯',
    title: 'Smart Defaults',
    description:
      '10-bit preservation, framerate matching, automatic audio conversion to PCM or AAC.',
  },
  {
    icon: '✏️',
    title: 'Custom Filenames',
    description:
      'Edit output filenames before transcoding. Suffix and extension auto-managed by preset.',
  },
  {
    icon: '📊',
    title: 'Size Estimation',
    description: 'See estimated output size before transcoding. Plan your storage accordingly.',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      className="feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="feature-icon"
        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
      >
        {feature.icon}
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
        <h2 className="section-title">Why Editing Transcoder?</h2>
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
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        .feature-card {
          background: var(--surface);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow);
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          display: inline-block;
        }
        .feature-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        .feature-desc {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }
      `}</style>
    </section>
  );
}
