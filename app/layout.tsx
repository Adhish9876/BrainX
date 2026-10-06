import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { getContent } from '@/lib/content';

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
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/fraunces-latin.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/source-sans-3-latin.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
