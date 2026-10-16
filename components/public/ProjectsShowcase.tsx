'use client';

import * as React from 'react';
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  MapPin,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Member, Project } from '@/lib/types';
import ScrollExpand from '@/components/ui/ScrollExpand';
import TagList from './TagList';

const DEMO_PROJECTS: Project[] = [
  {
    id: 'inhouse-project-1',
    category: 'inhouse',
    title: 'Adaptive Motor-Imagery Brain–Computer Interface for Neuro-Rehabilitation',
    description:
      'Developing a non-invasive EEG decoding pipeline and real-time neurofeedback loop for assistive motor rehabilitation. Combines subject-invariant spatial filtering, Riemannian geometry, and lightweight deep neural networks to translate motor imagery intentions into reliable robotic control commands.',
    image: '/media/pictures/demo_pic/photo-01.webp',
    images: [
      '/media/pictures/demo_pic/photo-01.webp',
      '/media/pictures/demo_pic/photo-02.webp',
      '/media/pictures/demo_pic/photo-03.webp',
    ],
    members: [
      'Dr. KANNADASAN K',
      'Yogeshwari R',
      'Nidhish Kumar M',
      'K B Sakthi Uma Maheswari',
    ],
    tags: [
      'Brain–Computer Interface',
      'Motor Imagery',
      'EEG Decoding',
      'Neuro-Rehabilitation',
    ],
    link: '',
  },
  {
    id: 'inhouse-project-2',
    category: 'inhouse',
    title: 'Multimodal Affective Computing & Cognitive Workload Monitoring System',
    description:
      'Investigating physiological and neural correlates of emotional states, stress, and mental fatigue using wearable EEG and peripheral biosignals. Engineered cross-subject emotion recognition algorithms and real-time operator state assessment dashboards for human–autonomy teaming.',
    image: '/media/pictures/demo_pic/photo-02.webp',
    images: [
      '/media/pictures/demo_pic/photo-02.webp',
      '/media/pictures/demo_pic/photo-04.webp',
      '/media/pictures/demo_pic/photo-05.webp',
    ],
    members: [
      'Dr. KANNADASAN K',
      'Yogeshwari R',
      'Adhishwar G',
      'Shashank G',
    ],
    tags: [
      'Affective Computing',
      'Emotion Recognition',
      'Wearable EEG',
      'Cognitive Workload',
    ],
    link: '',
  },
  {
    id: 'student-project-1',
    category: 'students',
    title: 'MindGlide: Low-Cost 3D-Printed BCI Prosthetic Hand with Hybrid EMG-EEG Feedback',
    description:
      'An open-source, lightweight prosthetic hand actuated by 3D-printed tendons and controlled via continuous sensor fusion of forearm surface EMG and motor-cortex EEG potentials. Enables intuitive grip selection and dexterous pinch modes for amputees.',
    image: '/media/pictures/demo_pic/photo-03.webp',
    images: [
      '/media/pictures/demo_pic/photo-03.webp',
      '/media/pictures/demo_pic/photo-06.webp',
      '/media/pictures/demo_pic/photo-07.webp',
    ],
    members: [
      'Adhishwar G',
      'Shashank G',
      'Nidhish Kumar M',
    ],
    tags: [
      'Assistive Tech',
      'Robotic Prosthetics',
      'Hybrid EMG-EEG',
      '3D Printing',
    ],
    link: '',
  },
  {
    id: 'student-project-2',
    category: 'students',
    title: 'NeuroSpeller: High-Speed P300 Brain Typing Interface for Assistive Communication',
    description:
      'An ergonomic virtual keyboard leveraging steady-state visual evoked potentials (SSVEP) and P300 oddball paradigms, achieving high information transfer rates for non-verbal individuals and ALS rehabilitation.',
    image: '/media/pictures/demo_pic/photo-04.webp',
    images: [
      '/media/pictures/demo_pic/photo-04.webp',
      '/media/pictures/demo_pic/photo-01.webp',
      '/media/pictures/demo_pic/photo-02.webp',
    ],
    members: [
      'K B Sakthi Uma Maheswari',
      'Yogeshwari R',
    ],
    tags: [
      'P300 Speller',
      'Brain Typing',
      'Assistive Tech',
      'Augmentative AI',
    ],
    link: '',
  },
];

const PLACEHOLDER_SLIDES = [
  {
    badge: 'Slide 01 · System Architecture',
    caption: 'Overview of experimental paradigm, signal acquisition & processing pipeline',
  },
  {
    badge: 'Slide 02 · Experimental Setup',
    caption: 'Multi-channel EEG recording hardware and subject paradigm interface',
  },
  {
    badge: 'Slide 03 · Decoding & Evaluation',
    caption: 'Cross-session classification performance and real-time feedback results',
  },
];

function getInitials(name: string): string {
  const cleaned = name.replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function collectProjectImages(project: Project): string[] {
  const list: string[] = [];
  if (project.image && project.image.trim()) {
    list.push(project.image.trim());
  }
  if (Array.isArray(project.images)) {
    for (const img of project.images) {
      if (typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
        list.push(img.trim());
      }
    }
  }
  return list;
}

function significantTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function findTeamMember(query: string, team: Member[]): Member | undefined {
  const trimmed = query.trim();
  if (!trimmed || team.length === 0) return undefined;
  const lower = trimmed.toLowerCase();

  const exactMatches = team.filter(
    (m) => m.id.toLowerCase() === lower || m.name.trim().toLowerCase() === lower,
  );
  if (exactMatches.length > 0) {
    return exactMatches.find((m) => Boolean(m.image?.trim())) ?? exactMatches[0];
  }

  const queryTokens = significantTokens(trimmed);
  if (queryTokens.length === 0) return undefined;

  const tokenMatches = team.filter((m) => {
    const memberTokens = significantTokens(m.name);
    return queryTokens.some((qt) => memberTokens.includes(qt));
  });

  if (tokenMatches.length > 0) {
    return tokenMatches.find((m) => Boolean(m.image?.trim())) ?? tokenMatches[0];
  }

  return undefined;
}

/**
 * Animated Treasure Map Connector:
 * Dotted curve with progressive mask that draws forward on scroll from previous node to next node.
 */
function TreasureMapConnector({
  direction = 'left-to-right',
  nodeLabel,
}: {
  direction: 'left-to-right' | 'right-to-left';
  nodeLabel: string;
}) {
  const connectorRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: connectorRef,
    offset: ['start 88%', 'end 35%'],
  });

  const pathProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  const rawId = React.useId();
  const maskId = `map-trail-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isLeftToRight = direction === 'left-to-right';

  // Desktop coords (viewBox 0 0 1000 130)
  const xStart = isLeftToRight ? 260 : 740;
  const xEnd = isLeftToRight ? 740 : 260;
  const pathD = isLeftToRight
    ? 'M 260 0 C 260 65, 740 65, 740 130'
    : 'M 740 0 C 740 65, 260 65, 260 130';

  const endPinScale = useTransform(pathProgress, [0.82, 1], [0.3, 1]);
  const endPinOpacity = useTransform(pathProgress, [0.75, 1], [0, 1]);

  return (
    <div
      ref={connectorRef}
      aria-hidden="true"
      className="relative z-0 my-2 sm:my-4 flex h-20 sm:h-28 w-full items-center justify-center overflow-visible select-none"
    >
      <svg
        viewBox="0 0 1000 130"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <mask id={maskId}>
            {/* Animating solid stroke unmasks the dotted trail as you scroll */}
            <motion.path
              d={pathD}
              fill="none"
              stroke="white"
              strokeWidth="28"
              strokeLinecap="round"
              style={{ pathLength: pathProgress }}
            />
          </mask>
        </defs>

        {/* Subtle background path */}
        <path
          d={pathD}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity={0.35}
        />

        {/* Animated Treasure Map Dotted Path */}
        <path
          d={pathD}
          fill="none"
          stroke="#0066cc"
          strokeWidth="3.2"
          strokeDasharray="8 9"
          strokeLinecap="round"
          mask={`url(#${maskId})`}
          className="drop-shadow-[0_2px_8px_rgba(0,102,204,0.4)]"
        />

        {/* Start waypoint beacon (solid dot with ring) */}
        <circle cx={xStart} cy={2} r={5} fill="#0066cc" />
        <circle
          cx={xStart}
          cy={2}
          r={9}
          fill="none"
          stroke="#0066cc"
          strokeWidth="1.5"
          opacity={0.5}
        />

        {/* Waypoint label marker near curve center */}
        <g
          transform={`translate(${isLeftToRight ? 500 : 500}, 65)`}
          className="hidden sm:block"
        >
          <rect
            x="-45"
            y="-11"
            width="90"
            height="22"
            rx="11"
            fill="#ffffff"
            stroke="#93c5fd"
            strokeWidth="1"
            className="shadow-xs"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#0066cc"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {nodeLabel}
          </text>
        </g>

        {/* Destination Waypoint Beacon: Activates and pulses when the trail arrives */}
        <motion.g
          style={{
            scale: endPinScale,
            opacity: endPinOpacity,
            transformOrigin: `${xEnd}px 128px`,
          }}
        >
          <circle cx={xEnd} cy={128} r={5} fill="#0066cc" />
          <circle
            cx={xEnd}
            cy={128}
            r={12}
            fill="none"
            stroke="#0066cc"
            strokeWidth="1.5"
            className="animate-ping"
          />
          <circle
            cx={xEnd}
            cy={128}
            r={9}
            fill="none"
            stroke="#0066cc"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>
    </div>
  );
}

/**
 * Initial Dotted Trail from the clicked Domain card down into the first project of that domain.
 */
function HeroToRoadmapTrail({
  domain,
}: {
  domain: 'inhouse' | 'students';
}) {
  const trailRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trailRef,
    offset: ['start 90%', 'end 35%'],
  });

  const pathProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  const rawId = React.useId();
  const maskId = `hero-trail-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const isStudents = domain === 'students';
  // Starts directly beneath the corresponding card:
  // In-House card is on left (x ~ 350)
  // Student Projects card is on right (x ~ 650)
  const xStart = isStudents ? 650 : 350;
  const xEnd = 500;
  const strokeColor = isStudents ? '#10b981' : '#0066cc';

  const pathD = isStudents
    ? 'M 650 0 C 650 70, 500 70, 500 140'
    : 'M 350 0 C 350 70, 500 70, 500 140';

  const endPinScale = useTransform(pathProgress, [0.82, 1], [0.3, 1]);
  const endPinOpacity = useTransform(pathProgress, [0.75, 1], [0, 1]);

  return (
    <div
      ref={trailRef}
      aria-hidden="true"
      className="relative z-10 -mt-2 mb-6 sm:mb-8 flex h-28 sm:h-36 w-full items-center justify-center overflow-visible select-none"
    >
      <svg
        viewBox="0 0 1000 140"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <defs>
          <mask id={maskId}>
            <motion.path
              d={pathD}
              fill="none"
              stroke="white"
              strokeWidth="28"
              strokeLinecap="round"
              style={{ pathLength: pathProgress }}
            />
          </mask>
        </defs>

        {/* Subtle guide line */}
        <path
          d={pathD}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity={0.35}
        />

        {/* Dotted Trail originating from the clicked card */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray="8 9"
          strokeLinecap="round"
          mask={`url(#${maskId})`}
          className={
            isStudents
              ? 'drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
              : 'drop-shadow-[0_2px_8px_rgba(0,102,204,0.4)]'
          }
        />

        {/* Origin waypoint pin directly beneath the clicked card */}
        <circle cx={xStart} cy={2} r={6} fill={strokeColor} />
        <circle
          cx={xStart}
          cy={2}
          r={12}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          className="animate-ping"
        />
        <circle
          cx={xStart}
          cy={2}
          r={9}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          opacity={0.7}
        />

        {/* Expedition Waypoint Label */}
        <g transform={`translate(${isStudents ? 575 : 425}, 70)`} className="hidden sm:block">
          <rect
            x="-85"
            y="-12"
            width="170"
            height="24"
            rx="12"
            fill="#ffffff"
            stroke={isStudents ? '#a7f3d0' : '#93c5fd'}
            strokeWidth="1"
            className="shadow-xs"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {isStudents ? 'TRAIL: STUDENT EXPEDITION' : 'TRAIL: IN-HOUSE EXPEDITION'}
          </text>
        </g>

        {/* Destination Waypoint Beacon leading into Project 01 */}
        <motion.g
          style={{
            scale: endPinScale,
            opacity: endPinOpacity,
            transformOrigin: `${xEnd}px 138px`,
          }}
        >
          <circle cx={xEnd} cy={138} r={6} fill={strokeColor} />
          <circle
            cx={xEnd}
            cy={138}
            r={13}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            className="animate-ping"
          />
          <circle
            cx={xEnd}
            cy={138}
            r={10}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>
    </div>
  );
}

/**
 * Sideways-Expanding Project Card:
 * Initially reveals the image prominently in a focused frame.
 * On scroll into view, the card expands sideways into full width, revealing the rich content side-by-side.
 */
function SidewaysExpandProjectCard({
  project,
  index,
  isStudent,
  isImageRight,
  team,
  onOpenModal,
}: {
  project: Project;
  index: number;
  isStudent: boolean;
  isImageRight: boolean;
  team: Member[];
  onOpenModal: (project: Project) => void;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px 0px -30px 0px' });

  const coverImage = project.image || (project.images && project.images[0]) || '';
  const contributorList = Array.isArray(project.members) ? project.members.slice(0, 4) : [];

  return (
    <div ref={cardRef} className="relative w-full">
      <motion.article
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${project.title}`}
        onClick={() => onOpenModal(project)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenModal(project);
          }
        }}
        initial={{
          maxWidth: '440px',
          opacity: 0.88,
          scale: 0.97,
        }}
        animate={
          isInView
            ? {
                maxWidth: '1080px',
                opacity: 1,
                scale: 1,
              }
            : {
                maxWidth: '440px',
                opacity: 0.88,
                scale: 0.97,
              }
        }
        transition={{
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ backgroundColor: '#ffffff' }}
        className="group relative z-10 mx-auto cursor-pointer overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 md:p-8 shadow-[0_12px_36px_-10px_rgba(11,16,32,0.10),0_4px_14px_-3px_rgba(11,16,32,0.05)] transition-shadow duration-300 hover:border-slate-300 hover:shadow-[0_20px_45px_-10px_rgba(11,16,32,0.16),0_8px_20px_-4px_rgba(11,16,32,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
      >
        <div
          className={`flex flex-col ${
            isImageRight ? 'md:flex-row-reverse' : 'md:flex-row'
          } items-stretch gap-6 sm:gap-8`}
        >
          {/* ── 1. The Project Image (Reveals first, anchors the node) ── */}
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 md:aspect-[4/3] md:w-80 lg:w-[390px]">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={project.title}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <ImageIcon className="h-8 w-8 text-slate-400" />
                <span className="mt-2 font-mono text-xs font-semibold text-slate-500">
                  Project {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* In-image node index pill */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.65rem] font-mono font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              <MapPin className="h-3 w-3 text-sky-400" />
              <span>Node 0{index + 1}</span>
            </div>

            {/* Subtle expansion cue when resting */}
            {!isInView && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-center text-xs font-semibold text-white">
                Scroll to expand details →
              </div>
            )}
          </div>

          {/* ── 2. Content Pane: Expands sideways as user scrolls into view ── */}
          <motion.div
            initial={{
              opacity: 0,
              x: isImageRight ? -25 : 25,
              filter: 'blur(5px)',
            }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    x: 0,
                    filter: 'blur(0px)',
                  }
                : {
                    opacity: 0,
                    x: isImageRight ? -25 : 25,
                    filter: 'blur(5px)',
                  }
            }
            transition={{
              duration: 0.65,
              delay: 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex min-w-0 flex-1 flex-col justify-between py-1"
          >
            <div>
              {/* Category & Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] ${
                    isStudent ? 'text-emerald-700' : 'text-[#0066cc]'
                  }`}
                >
                  {isStudent ? 'Student Initiative' : 'Lab R&D'} 0{index + 1}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider ${
                    isStudent
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                  }`}
                >
                  {isStudent ? 'Student Project' : 'In-House Project'}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-2.5 font-display text-xl font-bold leading-snug tracking-tight text-[#1d1d1f] transition-colors group-hover:text-[#0066cc] sm:text-2xl">
                {project.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-[1.75]">
                {project.description}
              </p>

              {/* Tags */}
              {project.tags && project.tags.length > 0 ? (
                <div className="mt-4">
                  <TagList
                    tags={project.tags}
                    className="[&_li]:px-2.5 [&_li]:py-0.5 [&_li]:text-xs"
                  />
                </div>
              ) : null}
            </div>

            {/* Bottom Row: Team Avatars & View Details CTA */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
              {/* Member Avatars */}
              {contributorList.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    {contributorList.map((memberName) => {
                      const resolved = findTeamMember(memberName, team);
                      return resolved?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={memberName}
                          src={resolved.image}
                          alt={memberName}
                          title={memberName}
                          className="inline-block h-8 w-8 rounded-full border-2 border-white object-cover shadow-2xs"
                        />
                      ) : (
                        <div
                          key={memberName}
                          title={memberName}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-[0.62rem] font-bold text-white shadow-2xs"
                        >
                          {getInitials(memberName)}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {contributorList.length}{' '}
                    {contributorList.length === 1 ? 'researcher' : 'researchers'}
                  </span>
                </div>
              ) : (
                <div />
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-all group-hover:border-[#0066cc] group-hover:bg-[#0066cc] group-hover:text-white sm:text-sm">
                  <span>View project</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>

                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open external link for ${project.title}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-[#0066cc] hover:text-[#0066cc]"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.article>
    </div>
  );
}

export default function ProjectsShowcase({
  projects,
  team = [],
}: {
  projects: Project[];
  team?: Member[];
}) {
  const items = projects.length > 0 ? projects : DEMO_PROJECTS;

  const [activeTab, setActiveTab] = React.useState<'all' | 'inhouse' | 'students'>('all');
  const [activeProject, setActiveProject] = React.useState<Project | null>(null);
  const [slideIndex, setSlideIndex] = React.useState(0);

  const inhouseProjects = React.useMemo(
    () => items.filter((p) => (p.category ?? 'inhouse') === 'inhouse'),
    [items],
  );
  const studentProjects = React.useMemo(
    () => items.filter((p) => p.category === 'students' || p.category === 'student'),
    [items],
  );

  const realImages = activeProject ? collectProjectImages(activeProject) : [];
  const totalSlides = realImages.length > 0 ? realImages.length : PLACEHOLDER_SLIDES.length;

  const openModal = (project: Project) => {
    setActiveProject(project);
    setSlideIndex(0);
  };

  const closeModal = React.useCallback(() => {
    setActiveProject(null);
    setSlideIndex(0);
  }, []);

  const goPrevSlide = React.useCallback(() => {
    setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goNextSlide = React.useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  React.useEffect(() => {
    if (!activeProject) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevSlide();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProject, closeModal, goPrevSlide, goNextSlide]);

  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [scrollBlur, setScrollBlur] = React.useState(0);
  const [bgOpacity, setBgOpacity] = React.useState(0);

  // Background smooth blur on scroll once leaving the hero
  React.useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const heroThreshold = window.innerHeight;

      if (y > heroThreshold * 0.4) {
        const past = y - heroThreshold * 0.4;
        const opacity = Math.min(0.65, (past / 200) * 0.65);
        const blur = Math.min(18, (past / 280) * 18);
        setBgOpacity(opacity);
        setScrollBlur(blur);
      } else {
        setBgOpacity(0);
        setScrollBlur(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectDomain = (domain: 'inhouse' | 'students') => {
    setActiveTab(domain);
    setIsUnlocked(true);

    setTimeout(() => {
      const targetId = domain === 'inhouse' ? 'inhouse-section' : 'students-section';
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const fallback = document.getElementById('projects-treasure-map');
        if (fallback) fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const isModalStudent =
    activeProject?.category === 'students' || activeProject?.category === 'student';

  return (
    <>
      {/* Dynamic blurred background — stays visible and blurs smoothly on scroll once unlocked */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/projects_bg.png"
          alt=""
          draggable={false}
          style={{
            filter: `blur(${scrollBlur}px)`,
            transform: 'scale(1.06)',
            willChange: 'filter, opacity',
            transition: 'filter 0.15s ease-out, opacity 0.2s ease-out',
            opacity: isUnlocked ? bgOpacity : 0,
          }}
          className="absolute inset-0 h-full w-full object-cover object-left-top mix-blend-multiply"
        />
      </div>

      {/* ── 1. INITIAL SCROLL-TO-REVEAL HERO USING <ScrollExpand /> ── */}
      <section className="relative w-full -mt-22 md:-mt-24">
        <ScrollExpand
          src="/projects_bg.png"
          alt="BrainX Projects Background"
          title="Projects"
          titleClassName="text-[#1d1d1f] font-display font-extrabold tracking-tight drop-shadow-[0_2px_24px_rgba(255,255,255,0.95)]"
          scrollHint="Scroll to explore ↓"
          useWindowScroll={true}
          startWidth={42}
          startHeight={58}
          startRadius={24}
          endRadius={0}
          mediaZoom={1.25}
          scrollDistance={1.05}
          holdDistance={0.02}
          smoothing={0.08}
          overlayScrim={0.55}
          className="w-full"
        >
          {/* Overlay that fades in once expanded to full bleed */}
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 text-center">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-sky-400 drop-shadow-sm">
              BrainX Lab Innovation
            </span>

            <h2 className="mt-2 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
              Pioneering Neural Technologies
            </h2>

            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-200 drop-shadow-sm">
              From core neural decoders and clinical rehabilitation systems to student-driven assistive
              robotics. Choose a domain below to explore the project map:
            </p>

            {/* The Two Domain Options */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6 w-full max-w-2xl pointer-events-auto">
              {/* Option 1: In-House Projects */}
              <button
                type="button"
                onClick={() => handleSelectDomain('inhouse')}
                className={`group relative flex flex-1 flex-col items-start rounded-2xl border p-5 sm:p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 ${
                  activeTab === 'inhouse' && isUnlocked
                    ? 'border-[#0066cc] bg-white ring-2 ring-[#0066cc] shadow-[0_20px_40px_-10px_rgba(0,102,204,0.35)]'
                    : 'border-white/30 bg-white/95 hover:border-sky-500 hover:shadow-[0_20px_40px_-10px_rgba(0,102,204,0.35)] focus-visible:ring-sky-500'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition-colors group-hover:bg-[#0066cc] group-hover:text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-sky-800">
                    {inhouseProjects.length} Projects
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900 group-hover:text-[#0066cc] transition-colors">
                  In-House Projects
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Core neural decoding pipelines, clinical EEG neurofeedback &amp; BCI platforms.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#0066cc]">
                  <span>Explore in-house</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                </div>
              </button>

              {/* Option 2: Student Projects */}
              <button
                type="button"
                onClick={() => handleSelectDomain('students')}
                className={`group relative flex flex-1 flex-col items-start rounded-2xl border p-5 sm:p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 ${
                  activeTab === 'students' && isUnlocked
                    ? 'border-emerald-500 bg-white ring-2 ring-emerald-500 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.35)]'
                    : 'border-white/30 bg-white/95 hover:border-emerald-500 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.35)] focus-visible:ring-emerald-500'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-emerald-800">
                    {studentProjects.length} Projects
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Student Projects
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Assistive prosthetics, robotic sensor fusion &amp; capstone engineering prototypes.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span>Explore student projects</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
                </div>
              </button>
            </div>
          </div>
        </ScrollExpand>
      </section>

      {/* ── 2. THE TREASURE MAP SHOWCASE CONTAINER ── */}
      <div
        id="projects-treasure-map"
        style={{ display: isUnlocked ? 'block' : 'none' }}
        className="relative scroll-mt-24 bg-transparent py-12 sm:py-16"
      >
        {/* Subtle coordinate dot pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:28px_28px]"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Initial Dotted Trail from Clicked Card */}
          {activeTab !== 'all' && (
            <HeroToRoadmapTrail domain={activeTab} />
          )}
          {/* Domain Filter Pills */}
          <div className="mb-12 flex flex-col items-center justify-between gap-4 border-b border-slate-200/80 pb-6 sm:flex-row">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0066cc]">
                Interactive Roadmap
              </span>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                Research &amp; Engineering Nodes
              </h2>
            </div>

            <div className="inline-flex rounded-full border border-slate-200/90 bg-white p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Nodes ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inhouse')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'inhouse'
                    ? 'bg-[#0066cc] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                In-House ({inhouseProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'students'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Students ({studentProjects.length})
              </button>
            </div>
          </div>

          {/* ── SECTION 1: IN-HOUSE PROJECTS ── */}
          {(activeTab === 'all' || activeTab === 'inhouse') && (
            <section
              id="inhouse-section"
              className="scroll-mt-28 space-y-6 pt-2"
            >
              <div className="flex flex-col gap-1 border-l-4 border-[#0066cc] pl-4">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0066cc]">
                  Primary Stream · Lab R&amp;D
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                  In-House Research Projects
                </h3>
                <p className="max-w-2xl text-sm sm:text-base text-slate-600">
                  Advanced neural engineering pipelines, Riemannian EEG classifiers, and assistive
                  neuro-rehabilitation prototypes engineered in-house.
                </p>
              </div>

              <div className="pt-4">
                {inhouseProjects.map((project, idx) => {
                  const isImageRight = idx % 2 === 1;
                  const hasNext = idx < inhouseProjects.length - 1;

                  return (
                    <React.Fragment key={project.id}>
                      <SidewaysExpandProjectCard
                        project={project}
                        index={idx}
                        isStudent={false}
                        isImageRight={isImageRight}
                        team={team}
                        onOpenModal={openModal}
                      />

                      {hasNext && (
                        <TreasureMapConnector
                          direction={isImageRight ? 'right-to-left' : 'left-to-right'}
                          nodeLabel={`TRAIL 0${idx + 1} ➔ 0${idx + 2}`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          )}

          {/* Treasure transition between In-House and Students if viewing 'all' */}
          {activeTab === 'all' && (
            <div className="py-6 sm:py-8">
              <TreasureMapConnector
                direction="left-to-right"
                nodeLabel="CROSS-DOMAIN EXPEDITION"
              />
            </div>
          )}

          {/* ── SECTION 2: STUDENT PROJECTS ── */}
          {(activeTab === 'all' || activeTab === 'students') && (
            <section
              id="students-section"
              className="scroll-mt-28 space-y-6 pt-4"
            >
              <div className="flex flex-col gap-1 border-l-4 border-emerald-600 pl-4">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Student Initiatives · Capstone
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
                  Student Projects &amp; Prototypes
                </h3>
                <p className="max-w-2xl text-sm sm:text-base text-slate-600">
                  Student-led brain typing interfaces, robotic neuro-prosthetics, and low-cost
                  hybrid EMG-EEG hardware platforms.
                </p>
              </div>

              <div className="pt-4">
                {studentProjects.map((project, idx) => {
                  const globalIdx = inhouseProjects.length + idx;
                  const isImageRight = globalIdx % 2 === 1;
                  const hasNext = idx < studentProjects.length - 1;

                  return (
                    <React.Fragment key={project.id}>
                      <SidewaysExpandProjectCard
                        project={project}
                        index={globalIdx}
                        isStudent={true}
                        isImageRight={isImageRight}
                        team={team}
                        onOpenModal={openModal}
                      />

                      {hasNext && (
                        <TreasureMapConnector
                          direction={isImageRight ? 'right-to-left' : 'left-to-right'}
                          nodeLabel={`TRAIL 0${globalIdx + 1} ➔ 0${globalIdx + 2}`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── 3. PROJECT DETAIL MODAL WITH SLIDESHOW & TEAM CONTRIBUTORS ── */}
      {activeProject ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider ${
                    isModalStudent
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                  }`}
                >
                  {isModalStudent ? 'Student Project' : 'In-House Project'}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-7">
              {/* Slideshow Area */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950">
                <div className="relative aspect-[16/9] w-full">
                  {realImages.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={realImages[slideIndex]}
                      alt={`${activeProject.title} slide ${slideIndex + 1}`}
                      className="h-full w-full object-cover transition-opacity duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                      <ImageIcon className="h-10 w-10 text-slate-400" />
                      <span className="mt-3 font-mono text-xs text-slate-400">
                        {PLACEHOLDER_SLIDES[slideIndex]?.badge}
                      </span>
                      <p className="mt-1 text-sm font-medium">
                        {PLACEHOLDER_SLIDES[slideIndex]?.caption}
                      </p>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {totalSlides > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-xs transition hover:bg-white hover:text-slate-900"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-xs transition hover:bg-white hover:text-slate-900"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Slide indicator dots */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-1.5 bg-slate-900/90 py-2.5">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          slideIndex === i ? 'w-6 bg-white' : 'w-2 bg-white/40'
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h2
                  id="project-modal-title"
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]"
                >
                  {activeProject.title}
                </h2>

                <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                  {activeProject.description}
                </p>
              </div>

              {/* Tags */}
              {activeProject.tags && activeProject.tags.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Technologies &amp; Paradigms
                  </h4>
                  <div className="mt-2.5">
                    <TagList tags={activeProject.tags} />
                  </div>
                </div>
              )}

              {/* Contributors / Team Members */}
              {activeProject.members && activeProject.members.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    Project Contributors
                  </h4>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {activeProject.members.map((memberName) => {
                      const resolved = findTeamMember(memberName, team);
                      return (
                        <div
                          key={memberName}
                          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5"
                        >
                          {resolved?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolved.image}
                              alt={memberName}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                              {getInitials(memberName)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {memberName}
                            </p>
                            {resolved?.role && (
                              <p className="truncate text-xs text-slate-500">
                                {resolved.role}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* External Link */}
              {activeProject.link && (
                <div className="pt-2">
                  <a
                    href={activeProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0066cc] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3]"
                  >
                    <span>View Project Repository / Publication</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
