import type { Metadata } from 'next';
import TreasureMapShowcase from '@/components/public/TreasureMapShowcase';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Projects & Expedition Atlas',
  description: 'Exploratory cartography of neural interfaces, decoders, and student robotics at BrainX Lab.',
};

export default function ProjectsPage() {
  const { projects, team } = getContent();

  return (
    <div className="relative isolate min-h-screen bg-white">
      <TreasureMapShowcase projects={projects} team={team} />
    </div>
  );
}
