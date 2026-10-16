'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * Bio that starts collapsed behind a "Discover" button. On click the button melts away and the
 * words fade in one after another, as if being typed out. The full text always stays in the DOM
 * (visually hidden until revealed) so screen readers and search engines can read it.
 */
export default function RevealBio({
  text,
  label = 'Discover more',
  className = '',
  size = 'md',
}: {
  text: string;
  label?: string;
  className?: string;
  size?: 'md' | 'sm';
}) {
  const small = size === 'sm';
  const [revealed, setRevealed] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  // Keep the whole sequence to a comfortable few seconds, however long the bio is
  const perWord = Math.min(0.03, 3.6 / Math.max(words.length, 1));

  return (
    <div className={className}>
      {/* Always available to assistive tech / crawlers */}
      <p className="sr-only">{text}</p>

      <AnimatePresence initial={false}>
        {!revealed && (
          <motion.div
            key="cta"
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className={`group relative inline-flex items-center overflow-hidden rounded-full bg-[#1d1d1f] font-semibold text-white ${
                small ? 'gap-1.5 px-3.5 py-1.5 text-xs' : 'gap-2.5 px-6 py-3 text-sm'
              } shadow-[0_10px_30px_-10px_rgba(11,16,32,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(11,16,32,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-600 focus-visible:ring-offset-2 cursor-pointer`}
            >
              {/* soft moving sheen */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
              />
              <span className="relative">{label}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {revealed && (
        <motion.p
          aria-hidden="true"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`overflow-hidden text-[#424245] ${
            small ? 'text-sm leading-relaxed' : 'max-w-3xl text-[0.95rem] leading-[1.8]'
          }`}
        >
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.55,
                delay: reduceMotion ? 0 : 0.25 + index * perWord,
                ease: 'easeOut',
              }}
              className="inline-block whitespace-pre"
            >
              {word}{' '}
            </motion.span>
          ))}
        </motion.p>
      )}
    </div>
  );
}
