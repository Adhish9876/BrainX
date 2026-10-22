import type { Metadata } from 'next';
import Reveal from '@/components/home/Reveal';
import ProjectsTimeline from '@/components/public/ProjectsTimeline';
import { getContent } from '@/lib/content';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Neural interfaces, decoders and assistive systems built at BrainX Lab, by the team and by students.',
};

export default function ProjectsPage() {
  const { projects } = getContent();

  return (
    <div className="relative isolate overflow-x-clip bg-white">
      <section className="relative isolate -mt-16 overflow-hidden pt-16 sm:-mt-20 sm:pt-20 md:-mt-24 md:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/projects_bg.png" alt="" draggable={false} className="h-full w-full object-cover object-left opacity-60 saturate-[0.85]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="shell pb-8 pt-4 sm:pt-6 md:pb-10 md:pt-8">
          <Reveal>
            <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1d1d1f] sm:text-5xl lg:text-7xl">
              Built in the lab.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 sm:text-xl">
              Systems we have designed and built, from closed-loop neurofeedback to assistive brain–computer
              interfaces.
            </p>
          </Reveal>
        </div>
      </section>

      <ProjectsTimeline projects={projects} />
    </div>
  );
}
