import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Lora } from 'next/font/google';
import './globals.css';
import { getContent } from '@/lib/content';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${lora.variable}`}>
      <head>
        {/* Home page only: when it is reloaded (or reached with Back) while scrolled down, the browser restores the
            scroll position after first paint. Remember it, and pre-place the "Pioneering…" section so it does not
            flash in its parked state. Lives here (not in a page component) because React does not allow <script>
            tags inside components. */}
        <style>{`html.bx-restored #who-we-are > div { transform: none !important; }`}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;if(location.pathname==='/'){addEventListener('pagehide',function(){sessionStorage.setItem('bx-home-sy',String(window.scrollY))});var n=performance.getEntriesByType('navigation')[0];var r=n&&(n.type==='reload'||n.type==='back_forward');if(r&&Number(sessionStorage.getItem('bx-home-sy'))>50)d.classList.add('bx-restored')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
