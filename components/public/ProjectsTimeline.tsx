'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/types';

type Filter = 'all' | 'inhouse' | 'students';

/** Shown only until a real project exists; replaced automatically once projects are added in the admin. */
const PLACEHOLDERS: Project[] = [
  {
    id: 'placeholder-inhouse',
    category: 'inhouse',
    title: 'Your first project: appears here',
    description:
      'This is a placeholder. Add a project from the admin page, with a title, a description, tags and photos.\nIt will replace this card, and each new project becomes the next step on the timeline.\nScrolling moves from one project to the next.',
    image: '',
    images: ['/media/pictures/demo_pic/photo-01.webp', '/media/pictures/demo_pic/photo-05.webp'],
    members: [],
    tags: ['In-house', 'Placeholder'],
    link: '',
  },
  {
    id: 'placeholder-student',
    category: 'students',
    title: 'Student project: placeholder',
    description:
      'A second placeholder, so you can see how the timeline moves between projects.\nStudent and in-house projects share this timeline, and visitors can filter between them.',
    image: '',
    images: ['/media/pictures/demo_pic/photo-03.webp', '/media/pictures/demo_pic/photo-07.webp'],
    members: [],
    tags: ['Students', 'Placeholder'],
    link: '',
  },
];

const isStudent = (p: Project) => p.category === 'students' || p.category === 'student';
const categoryLabel = (p: Project) => (isStudent(p) ? 'Student project' : 'In-house project');

/** "NeuroFeedback: Closed-Loop EEG…" -> "NeuroFeedback" */
function shortName(title: string): string {
  const head = title.split(':')[0].trim();
  if (head && head.length <= 28) return head;
  const words = title.split(/\s+/);
  const t = words.slice(0, 3).join(' ');
  return t.length > 28 ? `${t.slice(0, 26)}…` : t;
}

function projectImages(p: Project): string[] {
  const list: string[] = [];
  for (const src of [p.image, ...(p.images ?? [])]) {
    const v = typeof src === 'string' ? src.trim() : '';
    if (v && !list.includes(v)) list.push(v);
  }
  return list;
}

/** One bullet per line, or per sentence when the description is a single paragraph. */
function bullets(description: string): string[] {
  const lines = description.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return description
    .split(/(?<=[.!?])\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Auto-advancing photo carousel with dots. `fill` makes it cover its parent instead of using a 4:3 box. */
function Photos({ images, title, fill = false }: { images: string[]; title: string; fill?: boolean }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % images.length), 4500);
    return () => window.clearInterval(t);
  }, [images.length]);

  if (images.length === 0) return null;
  return (
    <div className={`relative w-full overflow-hidden bg-slate-100 ${fill ? 'h-full' : 'aspect-[4/3] rounded-2xl border border-slate-200'}`}>
      {images.map((src, n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${n}`}
          src={src}
          alt={`${title} photo ${n + 1}`}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${n === i ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {images.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Show photo ${n + 1}`}
              onClick={() => setI(n)}
              className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The grey card with the title, a one-line summary and a white panel of details. */
function ProjectCard({ project }: { project: Project }) {
  const images = projectImages(project);
  const members = Array.isArray(project.members) ? project.members : [];
  const meta = [categoryLabel(project), project.period || (members.length ? `${members.length} ${members.length === 1 ? 'member' : 'members'}` : '')]
    .filter(Boolean)
    .join('  |  ');
  const hasLink = Boolean(project.link) && project.link !== '/projects';
  const external = hasLink && /^https?:\/\//i.test(project.link);

  return (
    <article className="rounded-[2rem] bg-[#f3f3f4] p-3 sm:p-4">
      <header className="px-3 pb-4 pt-3 sm:px-4">
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-[#111] sm:text-3xl">{project.title}</h3>
        <p className="mt-1.5 text-base text-[#222]">{meta}</p>
      </header>

      <div className={`grid gap-6 rounded-[1.5rem] bg-white p-5 sm:p-7 ${images.length ? 'lg:grid-cols-12' : ''}`}>
        <div className={images.length ? 'lg:col-span-7' : ''}>
          {project.tags && project.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm text-[#111]">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="mt-6 space-y-4">
            {bullets(project.description).map((line, n) => (
              <li key={n} className="flex gap-3 text-[1.02rem] leading-relaxed text-[#111]">
                <span aria-hidden="true" className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-[#111]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {members.length > 0 ? (
            <p className="mt-6 text-[0.95rem] text-slate-600">
              <span className="font-semibold text-[#111]">Team: </span>
              {members.join(', ')}
            </p>
          ) : null}

          {hasLink ? (
            external ? (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex items-center gap-3 rounded-full bg-[#1a1a1a] py-3 pl-6 pr-3.5 text-base font-semibold text-white transition-colors hover:bg-black"
              >
                View project
                <span className="grid size-7 place-items-center rounded-full bg-white text-[#1a1a1a]">
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </a>
            ) : (
              <Link
                href={project.link}
                className="group mt-7 inline-flex items-center gap-3 rounded-full bg-[#1a1a1a] py-3 pl-6 pr-3.5 text-base font-semibold text-white transition-colors hover:bg-black"
              >
                View project
                <span className="grid size-7 place-items-center rounded-full bg-white text-[#1a1a1a]">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </Link>
            )
          ) : null}
        </div>

        {images.length ? (
          <div className="lg:col-span-5">
            <Photos images={images} title={project.title} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/**
 * One project on large screens. The photo fills the stage first; as you scroll it glides to one side and the
 * details fade in beside it. Scrolling only decides *when* it happens, the motion itself always plays at the
 * same calm speed.
 */
function ProjectStage({ project, index, total, side }: { project: Project; index: number; total: number; side: 'left' | 'right' }) {
  const ref = React.useRef<HTMLElement | null>(null);
  // No pinning: the page scrolls normally. Once the project is well into view, the transition plays by itself.
  // Each project always gets its moment, however fast you scroll: reaching it snaps to the full photo, then the
  // transition plays on a timer (page scroll is held for that ~1.5s), then the page is free again.
  // It plays once; scrolling back up never replays or reverses it.
  const [stage, setStage] = React.useState(0);
  const played = React.useRef(false);
  const timers = React.useRef<number[]>([]);
  const unlockRef = React.useRef<(() => void) | null>(null);

  const pinTop = () => {
    const el = ref.current;
    return el ? el.getBoundingClientRect().top + window.scrollY - 96 : 0;
  };

  // Freezes the page itself (wheel, touch, keys, scrollbar, trackpad momentum) without moving anything
  const lockScroll = () => {
    const root = document.documentElement;
    const prev = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev.overflow;
      root.style.scrollbarGutter = prev.gutter;
    };
  };

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 96px', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (played.current || v < 0) return;
    const rect = ref.current?.getBoundingClientRect();
    if (v >= 1 && rect && rect.bottom < 160) return; // already scrolled well past it: handled when it's reached again
    played.current = true;
    // Only correct the position when it overshot noticeably (a very fast scroll); a normal scroll is left alone
    const top = pinTop();
    if (Math.abs(window.scrollY - top) > 24) window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
    unlockRef.current = lockScroll();
    setStage(1);
    timers.current.push(
      window.setTimeout(() => {
        unlockRef.current?.();
        unlockRef.current = null;
      }, 1200),
    );
  });
  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      unlockRef.current?.();
    },
    [],
  );
  const open = stage >= 1;
  const interactive = stage >= 1;

  const images = projectImages(project);
  const members = Array.isArray(project.members) ? project.members : [];
  const hasLink = Boolean(project.link) && project.link !== '/projects';
  const external = hasLink && /^https?:\/\//i.test(project.link);
  const imageLeft = side === 'left';
  const IMG_W = 42;
  const dark = index % 2 === 0;
  const ink = dark ? 'text-white' : 'text-[#111]';
  const soft = dark ? 'text-white/65' : 'text-slate-500';
  // Plain CSS transitions (run by the browser, not by JS each frame), choreographed in order:
  // opening = photo narrows first, then the details fade in; closing = details leave first, then the photo widens.
  const CUT = 100 - IMG_W;
  const MOVE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const photoT = `0.9s ${MOVE}`;
  const textFade = `opacity 0.5s ease 0.25s, transform 0.6s ${MOVE} 0.25s`;

  const linkClass =
    `group mt-8 inline-flex items-center gap-3 rounded-full py-3 pl-6 pr-3.5 text-base font-semibold transition-colors ${dark ? 'bg-white text-[#111] hover:bg-slate-200' : 'bg-[#1a1a1a] text-white hover:bg-black'}`;
  const linkInner = (
    <>
      View project
      <span className={`grid size-7 place-items-center rounded-full ${dark ? 'bg-[#111] text-white' : 'bg-white text-[#1a1a1a]'}`}>
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </>
  );

  return (
    <section
      ref={ref}
      aria-label={project.title}
      className={`relative ${dark ? 'bg-[#0b0e16]' : 'bg-[#eeeff2]'}`}
      style={{ height: 'calc(100svh - 6rem + 6svh)' }}
    >
      <div className="sticky top-24 overflow-hidden" style={{ height: 'calc(100svh - 6rem)' }}>
        <div className="relative mx-auto h-full w-full max-w-[1760px] px-4 py-4 sm:px-6 xl:px-10">
          <div className="relative h-full [container-type:inline-size]">
            {/* The photo is laid out once at full size; only the frame around it changes, so it never re-scales mid-move */}
            <div
              className="absolute overflow-hidden rounded-[2rem] bg-slate-200"
              style={{
                [imageLeft ? 'left' : 'right']: 0,
                top: open ? '11%' : '0%',
                bottom: open ? '11%' : '0%',
                width: open ? `${IMG_W}%` : '100%',
                transition: `width ${photoT}, top ${photoT}, bottom ${photoT}`,
                contain: 'layout paint',
                willChange: 'width, top, bottom',
              }}
            >
              <div
                className="absolute top-0 will-change-transform"
                style={{
                  [imageLeft ? 'left' : 'right']: 0,
                  width: '100cqw',
                  height: '100%',
                  transform: `translate3d(${open ? (imageLeft ? -CUT / 2 : CUT / 2) : 0}%, 0, 0)`,
                  transition: `transform ${photoT}`,
                }}
              >
                <Photos images={images} title={project.title} fill />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-8 pb-8 pt-24"
                  style={{ opacity: open ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  <p className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">{project.title}</p>
                  <p className="mt-2 text-base text-white/80">{categoryLabel(project)}</p>
                </div>
              </div>
            </div>

            <div
              className="absolute top-0 flex h-full flex-col justify-center overflow-y-auto"
              style={{
                width: `${100 - IMG_W - 8}%`,
                [imageLeft ? 'right' : 'left']: 0,
                opacity: interactive ? 1 : 0,
                transform: interactive ? 'translate3d(0,0,0)' : 'translate3d(0,22px,0)',
                transition: textFade,
                pointerEvents: interactive ? 'auto' : 'none',
              }}
              aria-hidden={!interactive}
            >
              <p className={`font-mono text-xs font-semibold uppercase tracking-[0.18em] ${soft}`}>
                {[String(index + 1).padStart(2, '0'), categoryLabel(project), project.period].filter(Boolean).join('  ·  ')}
              </p>
              <h3 className={`mt-3 font-display text-3xl font-semibold leading-tight tracking-tight xl:text-4xl ${ink}`}>{project.title}</h3>

              {project.tags && project.tags.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li key={tag} className={`rounded-full border px-3.5 py-1.5 text-sm ${dark ? 'border-white/20 text-white/90' : 'border-slate-300 text-[#111]'}`}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              <ul className="mt-6 space-y-3.5">
                {bullets(project.description).map((line, n) => (
                  <li key={n} className={`flex gap-3 text-[1.02rem] leading-relaxed ${dark ? 'text-white/85' : 'text-[#222]'}`}>
                    <span aria-hidden="true" className={`mt-[0.62rem] size-1.5 shrink-0 rounded-full ${dark ? 'bg-white' : 'bg-[#111]'}`} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {members.length > 0 ? (
                <p className={`mt-6 text-[0.95rem] ${soft}`}>
                  <span className={`font-semibold ${ink}`}>Team: </span>
                  {members.join(', ')}
                </p>
              ) : null}

              {hasLink ? (
                external ? (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className={`${linkClass} self-start`}>
                    {linkInner}
                  </a>
                ) : (
                  <Link href={project.link} className={`${linkClass} self-start`}>
                    {linkInner}
                  </Link>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Projects: stacked cards on small screens, a scroll-driven image-then-details sequence on large ones. */
export default function ProjectsTimeline({ projects }: { projects: Project[] }) {
  const list = projects.length > 0 ? projects : PLACEHOLDERS;
  const hasBoth = list.some(isStudent) && list.some((p) => !isStudent(p));
  const [filter, setFilter] = React.useState<Filter>('all');
  const items = React.useMemo(() => {
    if (!hasBoth || filter === 'all') return list;
    return list.filter((p) => (filter === 'students' ? isStudent(p) : !isStudent(p)));
  }, [list, hasBoth, filter]);

  return (
    <div className="pb-8">
      {hasBoth ? (
        <div className="shell flex justify-center pb-6 pt-2">
          <div role="tablist" aria-label="Project type" className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {(
              [
                ['all', 'All projects'],
                ['inhouse', 'In-house'],
                ['students', 'Student'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  filter === key ? 'bg-[#1a1a1a] text-white' : 'text-slate-600 hover:text-[#111]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="shell space-y-8 lg:hidden">
        {items.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <div className="hidden lg:block">
        {items.map((p, i) => (
          <ProjectStage key={`${filter}-${p.id}`} project={p} index={i} total={items.length} side={i % 2 === 0 ? 'left' : 'right'} />
        ))}
      </div>
    </div>
  );
}
