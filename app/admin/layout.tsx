import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin · BrainX Lab',
  description: 'Content administration for BrainX Lab.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-dvh bg-slate-50 text-slate-900">{children}</div>;
}
