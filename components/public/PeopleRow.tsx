'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Member } from '@/lib/types';
import { MemberPortrait } from './TeamCard';

const SIDE_PADDING = 'max(1.25rem, calc((100% - 76rem) / 2 + 2.5rem))';

/** Bio that types itself in word by word once its panel has opened. */
function TypedWords({ text, delay = 0.35 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion();
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const perWord = Math.min(0.03, 3.2 / Math.max(words.length, 1));
  return (
    <p aria-hidden="true" className="text-sm leading-relaxed text-[#424245] sm:text-[0.95rem] sm:leading-[1.75]">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={reduce ? false : { opacity: 0, y: 6, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: reduce ? 0 : delay + i * perWord, ease: 'easeOut' }}
          className="inline-block whitespace-pre"
        >
          {word}{' '}
        </motion.span>
      ))}
    </p>
  );
}

function PersonCard({
  member,
  open,
  large,
  center,
  onToggle,
}: {
  member: Member;
  open: boolean;
  large: boolean;
  center: boolean;
  onToggle: () => void;
}) {
  const hasBio = Boolean(member.description);

  // Collapsed / expanded widths; the portrait column keeps its size, the bio opens to its side
  const base = large ? '20rem' : '17.5rem';
  const expanded = 'min(90vw, 56rem)';

  return (
    <article
      data-card
      data-open={open ? 'true' : 'false'}
      style={{ width: open ? expanded : base }}
      className={`relative flex shrink-0 snap-start items-start overflow-hidden pb-6 ${center ? 'mx-auto' : ''} transition-[width] duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      {/* Portrait column (fixed width) with name, position and button inside the image */}
      <div className="relative shrink-0" style={{ width: base }}>
        <MemberPortrait
          member={member}
          zoomOnHover
          className="group aspect-[4/5] w-full rounded-[1.75rem] border border-slate-200/80 shadow-[0_2px_4px_rgba(11,16,32,0.04),0_14px_24px_-18px_rgba(11,16,32,0.3)]"
          initialsClassName={large ? 'text-8xl' : 'text-7xl'}
        />

        {/* Legibility fade for the text below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 rounded-b-[1.75rem] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="font-display text-xl font-bold leading-snug tracking-tight drop-shadow-sm">
            {member.name}
          </p>
          {member.tagline || member.position ? (
            <p className="mt-1 line-clamp-2 text-[0.82rem] leading-snug text-white/80">
              {member.tagline || member.position}
            </p>
          ) : null}

          {hasBio ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="mt-3.5 inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 cursor-pointer"
            >
              {open ? 'Close' : 'Discover more'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Bio panel that opens to the side */}
      <div
        className={`relative ml-5 flex min-w-0 flex-col self-start rounded-[1.75rem] bg-slate-50/80 p-6 transition-opacity duration-500 sm:p-8 ${
          open ? 'opacity-100 delay-200' : 'pointer-events-none opacity-0'
        }`}
        style={{
          width: `calc(min(90vw, 56rem) - ${base} - 1.25rem)`,
          minWidth: '16rem',
          maxHeight: `calc(${base} * 1.25)`,
        }}
        aria-hidden={!open}
      >
        {open && hasBio ? (
          <>
            <button
              type="button"
              onClick={onToggle}
              aria-label={`Close ${member.name}`}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-[#1d1d1f] shadow-sm transition-colors hover:bg-[#1d1d1f] hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-h-0 overflow-y-auto pr-10" style={{ scrollbarWidth: 'thin' }}>
              <TypedWords text={member.description} />
              {member.link ? (
                <a
                  href={member.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-all hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white"
                >
                  View profile
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {/* Full text always available to assistive tech and crawlers */}
      {member.description ? <span className="sr-only">{member.description}</span> : null}
    </article>
  );
}

/** Horizontal, snap-scrolling row of people. Opening a card widens it to the side to show their bio. */
export default function PeopleRow({
  members,
  large = false,
  center = false,
}: {
  members: Member[];
  large?: boolean;
  center?: boolean;
}) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [edge, setEdge] = React.useState({ start: true, end: true });

  // When a card opens, bring it fully into view by scrolling the row itself (never the page)
  React.useEffect(() => {
    if (!openId) return;
    const timer = window.setTimeout(() => {
      const scroller = scrollerRef.current;
      const card = scroller?.querySelector<HTMLElement>('[data-open="true"]');
      if (!scroller || !card) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const expandedWidth = Math.min(window.innerWidth * 0.9, 56 * rem);
      const pad = parseFloat(getComputedStyle(scroller).paddingLeft) || 0;
      const left = card.offsetLeft;
      const right = left + expandedWidth;
      if (right > scroller.scrollLeft + scroller.clientWidth - pad) {
        scroller.scrollTo({ left: Math.max(0, right - scroller.clientWidth + pad), behavior: 'smooth' });
      } else if (left < scroller.scrollLeft + pad) {
        scroller.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [openId]);

  const updateEdges = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  React.useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    // card widths animate, so keep the arrow state in sync while they do
    const timer = window.setInterval(updateEdges, 250);
    return () => {
      ro.disconnect();
      window.clearInterval(timer);
    };
  }, [updateEdges, members]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 24), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Edge arrows float over the row, so showing/hiding them never shifts the page layout */}
      {(['prev', 'next'] as const).map((dir) => {
        const visible = dir === 'prev' ? !edge.start : !edge.end;
        return (
          <button
            key={dir}
            type="button"
            onClick={() => scrollByCard(dir === 'next' ? 1 : -1)}
            tabIndex={visible ? 0 : -1}
            aria-hidden={!visible}
            aria-label={dir === 'next' ? 'Scroll to next people' : 'Scroll to previous people'}
            className={`absolute top-[38%] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-[#1d1d1f] shadow-lg backdrop-blur transition-all duration-300 hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white cursor-pointer ${
              dir === 'next' ? 'right-3 sm:right-5' : 'left-3 sm:left-5'
            } ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            {dir === 'next' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        );
      })}

      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        style={{
          paddingInline: SIDE_PADDING,
          scrollPaddingInline: SIDE_PADDING,
          scrollbarWidth: 'none',
        }}
        className="flex snap-x items-start gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
      >
        {members.map((member) => (
          <PersonCard
            key={member.id}
            member={member}
            large={large}
            center={center}
            open={openId === member.id}
            onToggle={() => setOpenId((cur) => (cur === member.id ? null : member.id))}
          />
        ))}
        {center ? null : <span aria-hidden="true" className="w-1 shrink-0" />}
      </div>
    </div>
  );
}
