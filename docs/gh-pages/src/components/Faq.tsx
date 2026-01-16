import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    id: 'original-files',
    question: 'Why not edit the original files directly?',
    answer: 'Many consumer formats (H.264, HEVC) use GOP compression, making timeline scrubbing sluggish. ProRes/DNxHR are intra-frame, ensuring smooth playback even with effects applied.',
  },
  {
    id: 'ffmpeg-install',
    question: 'Do I need to install FFmpeg separately?',
    answer: 'No! The application comes with FFmpeg bundled. Just extract and run.',
  },
  {
    id: 'batch-convert',
    question: 'Can I convert multiple files at once?',
    answer: 'Yes! The batch queue lets you add multiple files and transcode them in parallel, with individual progress tracking for each.',
  },
  {
    id: 'original-files-safe',
    question: 'What about my original files?',
    answer: 'The original files are never modified. The app creates new transcoded files in your chosen output location.',
  },
  {
    id: 'preset-choice',
    question: 'Which preset should I use?',
    answer: 'ProRes 422 is recommended for most editing workflows. Use ProRes 422 LT if storage is limited, DNxHR HQX on Windows, or H.264 CRF 18 for web sharing.',
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function FaqItem({ faq, index }: { faq: FaqItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="faq-item"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <motion.button
        className="faq-question"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ x: 4 }}
      >
        <span>{faq.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="faq-icon"
        >
          <ChevronDown size={18} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="faq-answer-inner">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .faq-item {
          background: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          text-align: left;
          font-weight: 500;
          color: var(--text);
        }
        .faq-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .faq-answer {
          overflow: hidden;
        }
        .faq-answer-inner {
          padding: 0 1.25rem 1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
      `}</style>
    </motion.div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="section">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <p className="section-subtitle">
        Common questions about video transcoding and editing workflows.
      </p>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <FaqItem key={faq.id} faq={faq} index={index} />
        ))}
      </div>

      <style>{`
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </section>
  );
}
