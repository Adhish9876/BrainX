import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { getContent } from '@/lib/content';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

// Site identity (name, logo/favicon) is read from data/site.json
const { site } = getContent();

export const metadata: Metadata = {
  title: {
    default: `${site.name}, ${site.institution}`,
    template: `%s — ${site.name}`,
  },
  description:
    site.tagline ||
    `${site.name} is the research group of the Department of Computer Science and Engineering at ${site.institution}.`,
  applicationName: site.name,
  icons: { icon: site.logo || '/logo.svg' },
  openGraph: {
    title: `${site.name}, ${site.institution}`,
    description: site.tagline || site.about.slice(0, 160),
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
