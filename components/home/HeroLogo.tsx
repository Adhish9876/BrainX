'use client';

import Link from 'next/link';
import TextType from '@/components/ui/TextType';

/**
 * Static hero centerpiece (logo + typed tagline) and scroll cue.
 * The text container has fixed dimensions so typing/deleting never shifts the logo.
 */
export default function HeroLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-4">
      {/* Dark shade behind the institute banner so its white text stays readable */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[16rem] bg-gradient-to-b from-black/80 via-black/45 to-transparent"
      />

      {/* Top-center institute banner logo */}
      <div className="pointer-events-none absolute top-1.5 sm:top-2 md:top-2.5 left-1/2 -translate-x-1/2 z-20 flex w-full justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logotop.png"
          alt="Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram"
          width={2048}
          height={327}
          className="h-auto w-[min(92vw,40rem)] lg:w-[min(80vw,48rem)] object-contain select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
          draggable={false}
        />
      </div>

      {/* Logo + typed quote side-by-side on desktop, centered cleanly in the hero banner */}
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10 translate-y-2 sm:translate-y-3 md:translate-y-5">
        <Link
          href="/"
          aria-label="BrainX Lab home"
          className="relative block shrink-0 focus-visible:outline-offset-8"
        >
          {/* Subtle luminous ambient glow behind the logo matching brain heatmap */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -m-8 rounded-full bg-gradient-to-tr from-[#f97316]/25 via-[#00b4d8]/30 to-[#0077b6]/35 blur-3xl transition-opacity duration-700"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brainx_lab_logo_solid.png"
            alt={alt}
            width={426}
            height={430}
            className="relative h-[min(44vw,15rem)] w-auto select-none drop-shadow-[0_14px_42px_rgba(0,0,0,0.65)] lg:h-[min(27vw,18rem)] transition-transform duration-500 hover:scale-[1.02]"
            draggable={false}
          />
        </Link>

        {/* Fixed-width & fixed-height slot so typing/deleting never shifts the logo */}
        <div className="flex h-[5.5rem] w-[min(100%,18.5rem)] shrink-0 items-center justify-center text-center sm:w-[22rem] lg:h-[9.5rem] lg:w-[22rem] lg:justify-start lg:text-left xl:w-[26rem]">
          <TextType
            as="p"
            text={[
              'Understanding the brain, building the interface.',
              'Decoding neural signals for human cognition.',
              'Advancing non-invasive brain–computer interfaces.',
            ]}
            typingSpeed={55}
            deletingSpeed={28}
            pauseDuration={2200}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-white font-normal"
            className="font-display text-[clamp(1.15rem,2.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.02em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.8),0_0_50px_rgba(0,180,216,0.2)]"
          />
        </div>
      </div>

      {/* Bottom-center subtle scroll cue */}
      <div className="pointer-events-none absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium tracking-wider uppercase text-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <span>Scroll to explore</span>
        <span className="inline-block animate-bounce text-sm text-[#38bdf8]">↓</span>
      </div>
    </div>
  );
}
