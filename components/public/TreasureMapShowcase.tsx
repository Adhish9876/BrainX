'use client';

import * as React from 'react';
import {
  AnimatePresence,
  motion,
} from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Compass,
  Image as ImageIcon,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { Member, Project } from '@/lib/types';
import ScrollExpand from '@/components/ui/ScrollExpand';
import Reveal from '@/components/home/Reveal';
import { Brain, Lightbulb } from '@phosphor-icons/react';
import TagList from './TagList';

// 13 waypoint circles on the trail of the 1024x1536 maps (positions in % of the map, detected from the artwork)
// Extra map height (as % of a full tile) kept below the last node of a cropped final tile
const TILE_TAIL_PADDING = 12;

const WAYPOINTS = [
  { x: 50.15, y: 5.11 },
  { x: 44.68, y: 8.66 },
  { x: 55.22, y: 14.78 },
  { x: 41.60, y: 22.04 },
  { x: 55.22, y: 28.55 },
  { x: 42.63, y: 35.03 },
  { x: 55.22, y: 50.29 },
  { x: 44.58, y: 58.86 },
  { x: 55.22, y: 65.46 },
  { x: 50.24, y: 78.23 },
  { x: 44.73, y: 81.80 },
  { x: 55.27, y: 87.89 },
  { x: 41.65, y: 94.99 },
];

/** One illustrated map per category; both share the same trail, so the waypoints above fit either. */
const MAP_SRC = {
  inhouse: '/map_inhouse.png',
  students: '/map_inhouse.png',
} as const;

function makePlaceholderProject(category: 'inhouse' | 'students'): Project {
  return {
    id: `placeholder-${category}`,
    category,
    title: 'Your next project lands here',
    description:
      'This placeholder is shown until a project is added from the admin page. Upload a project with photos and it will replace this card automatically.',
    image: '',
    images: [],
    members: [],
    tags: [],
    link: '',
  };
}

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

function getProjectShortTitle(project: Project): string {
  if (project.title.includes(':')) {
    const colonPrefix = project.title.split(':')[0].trim();
    if (colonPrefix.length > 0 && colonPrefix.length <= 22) {
      return colonPrefix;
    }
  }
  const words = project.title.split(/\s+/);
  if (words.length <= 3 && project.title.length <= 24) {
    return project.title;
  }
  const candidate = words.slice(0, 3).join(' ');
  return candidate.length > 24 ? candidate.slice(0, 22) + '…' : candidate;
}

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-sky-100 text-sky-900 border-sky-300',
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-indigo-100 text-indigo-900 border-indigo-300',
  'bg-rose-100 text-rose-900 border-rose-300',
  'bg-teal-100 text-teal-900 border-teal-300',
  'bg-violet-100 text-violet-900 border-violet-300',
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
 * MapWaypointPin:
 * - Rendered directly at the exact contour-calibrated coordinates of each circle on map2.png.
 * - Displays short project name in an authentic vintage ink parchment pill alternating left/right.
 * - Centered pip sits neatly inside the hand-drawn circle without number clutter.
 * - Golden glowing pulse when active/selected.
 */
function MapWaypointPin({
  id,
  project,
  index,
  waypoint,
  isSelected,
  isVisible = true,
  onSelect,
}: {
  id: string;
  project: Project;
  index: number;
  waypoint: (typeof WAYPOINTS)[number];
  isSelected: boolean;
  isVisible?: boolean;
  onSelect: () => void;
}) {
  const shortTitle = getProjectShortTitle(project);
  const isLeft = waypoint.x < 51;
  // The first waypoint sits at the very top edge of the map, so nudge its pill down to avoid clipping
  const isNearTop = waypoint.y < 5;

  return (
    <div
      id={id}
      style={{
        left: `${waypoint.x}%`,
        top: `${waypoint.y}%`,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
        isVisible
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-75 pointer-events-none'
      } ${isSelected ? 'z-40' : 'z-30'}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        aria-label={`Select waypoint ${index + 1}: ${shortTitle}`}
        className="group relative flex items-center cursor-pointer focus:outline-none"
      >
        {/* Central Pip directly inside the hand-drawn circle of map2.png */}
        <span
          className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
            'h-3 w-3 sm:h-3.5 sm:w-3.5 bg-[#fdf9f2] border-2 border-[#5c371d]/85 shadow-2xs group-hover:scale-125'
          }`}
        >
        </span>

        {/* Short Name Tag Pill: Alternates Left or Right based on mountain path */}
        <div
          className={`absolute top-1/2 pointer-events-auto whitespace-nowrap transition-all duration-200 ${
            isNearTop ? '-translate-y-[15%]' : '-translate-y-1/2'
          } ${
            isLeft
              ? 'right-full mr-2 sm:mr-3'
              : 'left-full ml-2 sm:ml-3'
          }`}
        >
          <div
            className={`flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[11px] font-bold tracking-tight shadow-md transition-all duration-200 max-w-[96px] xs:max-w-[120px] sm:max-w-[190px] ${
              isSelected
                ? 'bg-[#2b1708] text-[#fffcf5] border border-[#a16238] shadow-[0_4px_16px_rgba(43,23,8,0.45)] scale-105'
                : 'bg-[#fffdfa]/95 text-[#3d2312] border border-[#cfba9e]/80 hover:bg-[#fff9ef] hover:border-[#8c532b] hover:text-[#1c0e05] hover:scale-105'
            }`}
          >
            <span className="truncate">{shortTitle}</span>
          </div>
        </div>

      </button>
    </div>
  );
}

/**
 * ProjectPhotoCarousel: cross-fading carousel of the project's uploaded photos, with the title
 * captioned over the image. Auto-advances, pauses on hover, and supports arrows, dots and swipe.
 */
function ProjectPhotoCarousel({
  project,
  onExpand,
  expanded = false,
}: {
  project: Project;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  const images = React.useMemo(() => collectProjectImages(project), [project]);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touchX = React.useRef<number | null>(null);
  const count = images.length;

  const go = React.useCallback(
    (dir: 1 | -1) => setIndex((i) => (count ? (i + dir + count) % count : 0)),
    [count],
  );

  React.useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => go(1), 5000);
    return () => window.clearInterval(timer);
  }, [count, paused, go, index]);

  return (
    <div
      className={`group/carousel relative w-full flex-1 min-h-[235px] xs:min-h-[265px] sm:min-h-[300px] lg:min-h-[180px] overflow-hidden rounded-2xl border border-white/15 shadow-md bg-[#20150d] ${
        onExpand ? (expanded ? 'cursor-zoom-out' : 'cursor-zoom-in') : ''
      }`}
      onClick={(e) => {
        if (!onExpand || (e.target as HTMLElement).closest('button')) return;
        onExpand();
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {count === 0 ? (
        <div className="absolute inset-0 overflow-hidden bg-[#3a2211]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.category === 'students' || project.category === 'student' ? MAP_SRC.students : MAP_SRC.inhouse}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-[3px] saturate-75"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md">
              <Compass className="h-7 w-7" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      ) : (
        images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${project.title} photo ${i + 1}`}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-xs transition hover:bg-white hover:text-black group-hover/carousel:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-xs transition hover:bg-white hover:text-black group-hover/carousel:opacity-100 focus-visible:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {onExpand && (
        <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px] font-bold text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover/carousel:opacity-100">
          <Maximize2 className="h-3 w-3" aria-hidden />
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-md">
          {project.title}
        </h2>
      </div>
    </div>
  );
}

/**
 * ProjectDetailPanel (Cinematic Project Dossier):
 * - Hero View: Image first with rich caption directly ON the image.
 * - On scroll / toggle: Image decreases in size and docks to the side, revealing
 *   the detailed description, tags, and team members' photos in circles together!
 */
function ProjectDetailPanel({
  project,
  team,
  nextTitle,
  onNext,
  onExpand,
  expanded = false,
}: {
  project: Project | null;
  team: Member[];
  nextTitle?: string;
  onNext?: () => void;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-white/15 bg-black/40 p-8 text-center shadow-2xl backdrop-blur-xl">
        <p className="text-sm text-white/70">Select a project on the map to see its details.</p>
      </div>
    );
  }

  const contributors = Array.isArray(project.members) ? project.members : [];

  return (
    <div className="flex flex-col rounded-2xl sm:rounded-3xl border border-white/15 bg-black/40 backdrop-blur-xl p-4 sm:p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] h-full overflow-hidden">
      {/* Photo carousel with caption (title) directly on the image - fills upper section */}
      <ProjectPhotoCarousel key={project.id} project={project} onExpand={onExpand} expanded={expanded} />

      {/* Project Description */}
      <p className="mt-3.5 sm:mt-4 text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-3 shrink-0">
        {project.description}
      </p>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="mt-2 sm:mt-2.5 flex max-h-[26px] shrink-0 flex-wrap gap-1.5 overflow-hidden">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/10 px-2 sm:px-2.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Team members, project link and next stop */}
      {(contributors.length > 0 || project.link || onNext) && (
        <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-t border-white/15 pt-2.5 sm:pt-3">
          <div className="flex items-center -space-x-2 sm:-space-x-3 py-0.5 sm:py-1 pl-1 transition-all duration-300 hover:space-x-1">
            {contributors.map((memberName, idx) => {
              const matched = findTeamMember(memberName, team);
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div
                  key={memberName}
                  className="group/avatar relative transition-transform hover:scale-115 hover:z-30 cursor-pointer"
                  title={memberName}
                >
                  {matched?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={matched.image}
                      alt={memberName}
                      className="h-8 w-8 sm:h-11 sm:w-11 rounded-full border-2 border-white ring-2 ring-white/30 object-cover shadow-md"
                    />
                  ) : (
                    <div
                      className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white ring-2 ring-white/30 shadow-md font-mono text-[10px] sm:text-xs font-black uppercase ${avatarColor}`}
                    >
                      {getInitials(memberName)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-xs font-bold text-white transition hover:bg-white/20"
              >
                View
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="group/next flex min-w-0 max-w-[160px] xs:max-w-[190px] sm:max-w-[220px] items-center gap-1.5 rounded-full bg-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-xs font-bold text-[#1d1d1f] shadow-sm transition hover:bg-white/90 cursor-pointer"
              >
                <span className="truncate">Next: {nextTitle}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/next:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreasureMapShowcase({
  projects = [],
  team = [],
}: {
  projects?: Project[];
  team?: Member[];
}) {
  // Projects come straight from the admin-managed content (data/projects.json), split by category
  const realInhouseProjects = React.useMemo(
    () => projects.filter((p) => p.category === 'inhouse' || !p.category),
    [projects],
  );
  const realStudentProjects = React.useMemo(
    () => projects.filter((p) => p.category === 'students' || p.category === 'student'),
    [projects],
  );

  // A single placeholder fills an empty category and disappears once a real project is uploaded
  const inhouseProjects = React.useMemo(
    () => (realInhouseProjects.length > 0 ? realInhouseProjects : [makePlaceholderProject('inhouse')]),
    [realInhouseProjects],
  );
  const studentProjects = React.useMemo(
    () => (realStudentProjects.length > 0 ? realStudentProjects : [makePlaceholderProject('students')]),
    [realStudentProjects],
  );

  // States
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<'inhouse' | 'students'>('inhouse');
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(
    () => inhouseProjects[0]?.id || null,
  );
  const [activeProjectModal, setActiveProjectModal] = React.useState<Project | null>(null);
  const [slideIndex, setSlideIndex] = React.useState(0);

  const displayedProjects = activeCategory === 'students' ? studentProjects : inhouseProjects;
  const realCount = activeCategory === 'students' ? realStudentProjects.length : realInhouseProjects.length;

  // Ensure first waypoint is always active initially and upon category switch
  React.useEffect(() => {
    if (displayedProjects.length === 0) {
      if (selectedProjectId !== null) setSelectedProjectId(null);
    } else if (!selectedProjectId || !displayedProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(displayedProjects[0].id);
    }
  }, [displayedProjects, selectedProjectId]);

  // Domain selection happens on the same screen: the heading and cards lift away and the map workspace
  // rises in over the same photo (no page change, no white fade).
  const transitioningRef = React.useRef(false);
  const lockTransition = () => {
    transitioningRef.current = true;
    window.setTimeout(() => {
      transitioningRef.current = false;
    }, 700);
  };

  const handleSelectDomain = (domain: 'inhouse' | 'students') => {
    if (transitioningRef.current) return;
    lockTransition();
    setActiveCategory(domain);
    const targetProjects = domain === 'students' ? studentProjects : inhouseProjects;
    setSelectedProjectId(targetProjects[0]?.id || null);
    setIsUnlocked(true);
  };

  // No page scrolling: the screen is fixed (the workspace scrolls internally on small screens)
  React.useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = '';
    };
  }, []);

  // When second page (map section) is unlocked/active, prevent scrolling down to the footer
  React.useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    if (isUnlocked) {
      footer.style.display = 'none';
    } else {
      footer.style.display = '';
    }
    return () => {
      footer.style.display = '';
    };
  }, [isUnlocked]);

  const handleReturnToHero = () => {
    if (transitioningRef.current) return;
    lockTransition();
    setIsUnlocked(false);
  };

  // Selected project resolution for the right-hand content panel
  const selectedProject = React.useMemo(() => {
    if (!selectedProjectId) return null;
    return displayedProjects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, displayedProjects]);

  const selectedIndex = React.useMemo(() => {
    if (!selectedProject) return -1;
    return displayedProjects.findIndex((p) => p.id === selectedProject.id);
  }, [selectedProject, displayedProjects]);

  const selectedWaypoint = React.useMemo(() => {
    if (selectedIndex === -1) return null;
    return WAYPOINTS[selectedIndex % WAYPOINTS.length];
  }, [selectedIndex]);

  // Expanded project view: the photo panel grows and the real map scales down into a corner minimap
  const [expanded, setExpanded] = React.useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [rowW, setRowW] = React.useState(0);
  const [isLg, setIsLg] = React.useState(false);
  const [mapH, setMapH] = React.useState(0);
  React.useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      setRowW(row.clientWidth);
      setIsLg(window.innerWidth >= 1024);
      setMapH(mapContainerRef.current?.offsetHeight ?? 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isUnlocked]);
  // Width the map keeps at all times (matches its normal column), so it can be scaled instead of squeezed
  const mapW = isLg && rowW > 0 ? Math.max(0, rowW * (5 / 12) - 0.8 * 16) : 0;
  const MINI_W = 112;
  const miniScale = mapW > 0 ? MINI_W / mapW : 1;
  React.useEffect(() => {
    if (!isUnlocked) setExpanded(false);
  }, [isUnlocked]);
  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);


  // Reset map container to top whenever category changes or domain is selected
  React.useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollTop = 0;
    }
  }, [activeCategory, isUnlocked]);

  // Smooth scroll to a waypoint inside the map container
  const handleSelectWaypoint = React.useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
    },
    [],
  );

  // Stepping through waypoints from the right-hand panel
  const handlePrevProject = React.useCallback(() => {
    if (selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      handleSelectWaypoint(displayedProjects[prevIdx].id);
    }
  }, [selectedIndex, displayedProjects, handleSelectWaypoint]);

  const handleNextProject = React.useCallback(() => {
    if (selectedIndex < displayedProjects.length - 1) {
      const nextIdx = selectedIndex + 1;
      handleSelectWaypoint(displayedProjects[nextIdx].id);
    }
  }, [selectedIndex, displayedProjects, handleSelectWaypoint]);

  // The map never free-scrolls: wheel / swipe / arrow keys step exactly one waypoint at a time,
  // and the map glides to center that waypoint.
  const stepStateRef = React.useRef({ index: 0, count: 0, lastStep: 0 });
  stepStateRef.current.index = selectedIndex;
  stepStateRef.current.count = displayedProjects.length;
  const stepRef = React.useRef<(dir: 1 | -1) => boolean>(() => false);
  stepRef.current = (dir) => {
    const s = stepStateRef.current;
    const now = Date.now();
    if (now - s.lastStep < 180) return false;
    const next = Math.max(0, Math.min(s.count - 1, s.index + dir));
    if (next === s.index) return false;
    s.lastStep = now;
    s.index = next;
    handleSelectWaypoint(displayedProjects[next].id);
    return true;
  };

  React.useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || !isUnlocked) return;

    let touchY: number | null = null;

    // One scroll gesture = exactly one waypoint, however hard or long it is. After a step the wheel
    // stays locked until the event stream pauses (trackpad inertia / fast spins keep firing events).
    let locked = false;
    let lastEvent = 0;
    let lastStepAt = 0;
    let lastDir = 0;
    let lastAbs = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (dir === 0) return;
      const abs = Math.abs(e.deltaY);

      // Any new intent unlocks quickly: a short pause, a reversal, or a fresh flick on top of
      // trailing inertia (delta grows again). Inertia tails (shrinking deltas) stay ignored.
      if (locked && now - lastStepAt > 220) {
        const freshFlick = abs > lastAbs * 1.25 + 2;
        if (gap > 60 || dir !== lastDir || freshFlick) locked = false;
      }
      lastDir = dir;
      lastAbs = abs;
      if (locked) return;

      // Every non-trivial wheel event counts, so even a light scroll steps immediately
      if (abs < 2) return;
      if (stepRef.current(dir as 1 | -1)) {
        locked = true;
        lastStepAt = now;
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchY === null) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (Math.abs(dy) > 30) {
        stepRef.current(dy > 0 ? 1 : -1);
        touchY = null;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        stepRef.current(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        stepRef.current(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [isUnlocked]);

  // ── Traveler marker: glides along the trail from the previous waypoint to the new one ──
  const travelerRef = React.useRef<HTMLDivElement>(null);
  const travelerPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const travelerPrevRef = React.useRef<{ idx: number; category: string; unlocked: boolean } | null>(null);
  const travelerRafRef = React.useRef(0);

  React.useEffect(() => {
    const container = mapContainerRef.current;
    const traveler = travelerRef.current;
    if (!container || !traveler || !isUnlocked || selectedIndex < 0) {
      travelerPrevRef.current = null;
      travelerPosRef.current = null;
      if (traveler) traveler.style.opacity = '0';
      return;
    }

    const centerOf = (i: number) => {
      const el = document.getElementById(`map-waypoint-${i}`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - c.left - container.clientLeft + container.scrollLeft,
        y: r.top + r.height / 2 - c.top - container.clientTop + container.scrollTop,
      };
    };

    const maxScroll = () => Math.max(0, container.scrollHeight - container.clientHeight);
    const scrollGoalFor = (y: number) =>
      Math.max(0, Math.min(maxScroll(), y - container.clientHeight * 0.35));

    const place = (pt: { x: number; y: number }) => {
      travelerPosRef.current = pt;
      traveler.style.opacity = '1';
      traveler.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -50%)`;
    };

    cancelAnimationFrame(travelerRafRef.current);

    const prev = travelerPrevRef.current;
    travelerPrevRef.current = { idx: selectedIndex, category: activeCategory, unlocked: isUnlocked };

    const target = centerOf(selectedIndex);
    if (!target) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = travelerPosRef.current;
    if (!prev || prev.category !== activeCategory || !start || prev.idx === selectedIndex || reduceMotion) {
      place(target);
      container.scrollTop = scrollGoalFor(target.y);
    } else {
      // Waypoints from the previous stop to the new one; S-curve between each pair follows the trail
      const dir = selectedIndex > prev.idx ? 1 : -1;
      const pts: { x: number; y: number }[] = [start];
      for (let i = prev.idx + dir; i !== selectedIndex + dir; i += dir) {
        const c = centerOf(i);
        if (c) pts.push(c);
      }
      if (pts.length < 2) {
        place(target);
      } else {
        const segs = pts.length - 1;
        const duration = Math.min(1100, 420 + 120 * (segs - 1));
        const scrollFrom = container.scrollTop;
        const scrollTo = scrollGoalFor(target.y);
        const t0 = performance.now();
        // Ease-out so motion starts instantly (no perceived lag) and settles softly
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const frame = (now: number) => {
          // rAF timestamps can precede performance.now() taken above, so clamp to [0, 1]
          const t = ease(Math.max(0, Math.min(1, (now - t0) / duration)));
          const f = Math.min(segs - 1e-6, t * segs);
          const k = Math.max(0, Math.min(segs - 1, Math.floor(f)));
          const u = f - k;
          const a = pts[k];
          const b = pts[k + 1];
          const midY = (a.y + b.y) / 2;
          const v = 1 - u;
          // Cubic Bezier with vertical tangents: P0=a, P1=(a.x, midY), P2=(b.x, midY), P3=b
          place({
            x: v * v * v * a.x + 3 * v * v * u * a.x + 3 * v * u * u * b.x + u * u * u * b.x,
            y: v * v * v * a.y + 3 * v * v * u * midY + 3 * v * u * u * midY + u * u * u * b.y,
          });
          container.scrollTop = scrollFrom + (scrollTo - scrollFrom) * t;
          if (now - t0 < duration) {
            travelerRafRef.current = requestAnimationFrame(frame);
          } else {
            place(target);
            container.scrollTop = scrollTo;
          }
        };
        travelerRafRef.current = requestAnimationFrame(frame);
      }
    }

    return () => cancelAnimationFrame(travelerRafRef.current);
  }, [selectedIndex, activeCategory, isUnlocked]);

  // Dynamic map tile calculation: each map contains WAYPOINTS.length waypoints (13 on these maps)
  const tileCount = Math.max(1, Math.ceil(displayedProjects.length / WAYPOINTS.length));

  // Slideshow modal helpers
  const modalImages = React.useMemo(() => {
    return activeProjectModal ? collectProjectImages(activeProjectModal) : [];
  }, [activeProjectModal]);

  const totalSlides = Math.max(1, modalImages.length > 0 ? modalImages.length : PLACEHOLDER_SLIDES.length);

  const openSlidesModal = (proj: Project) => {
    setActiveProjectModal(proj);
    setSlideIndex(0);
  };

  const closeSlidesModal = React.useCallback(() => {
    setActiveProjectModal(null);
    setSlideIndex(0);
  }, []);

  const goPrevSlide = React.useCallback(() => {
    setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goNextSlide = React.useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  React.useEffect(() => {
    if (!activeProjectModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSlidesModal();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProjectModal, closeSlidesModal, goPrevSlide, goNextSlide]);

  return (
    <div className="relative w-full">
      {/* ── 1. INITIAL SCROLL-REVEAL HERO: ONLY "PROJECTS" AT REST, EXPANDS TO FULL BLEED ── */}
      <section className="bx-fade-in relative w-full">
        <ScrollExpand
          src="/project_newbg.png"
          alt="BrainX Projects Background"
          title="Projects"
          titleClassName="text-[#1d1d1f] font-display font-extrabold tracking-tight drop-shadow-[0_2px_24px_rgba(255,255,255,0.95)]"
          scrollHint="Scroll to explore ↓"
          useWindowScroll={true}
          enabled={false}
          startWidth={42}
          startHeight={58}
          startRadius={24}
          endRadius={0}
          mediaZoom={1.25}
          mediaObjectPosition="50% 90%"
          mediaClassName="blur-[3px] scale-[1.02]"
          scrollDistance={0.01}
          holdDistance={0}
          smoothing={0.06}
          overlayScrim={0.35}
          className="w-full"
        >
          {/* Children: Fades in over media once frame reaches full expansion */}
          <motion.div
            initial={false}
            animate={isUnlocked ? { opacity: 0, y: -48, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            inert={isUnlocked}
            className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 text-center"
          >
            <Reveal delay={0.1} y={18}>
              <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
                Projects
              </span>
            </Reveal>

            <Reveal delay={0.25} y={24}>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                Built in the lab.
              </h2>
            </Reveal>


            {/* The Two Domain Selection Options */}
            <Reveal delay={0.5} y={28} className="mt-8 flex w-full justify-center">
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-6 w-full max-w-[42rem] pointer-events-auto">
              {(
                [
                  {
                    key: 'inhouse',
                    title: 'In-House Projects',
                    glow: 'from-sky-400/50 via-sky-300/10',
                    activeRing: 'ring-white/80 border-white/70',
                  },
                  {
                    key: 'students',
                    title: 'Student Projects',
                    glow: 'from-emerald-400/50 via-emerald-300/10',
                    activeRing: 'ring-white/80 border-white/70',
                  },
                ] as const
              ).map(({ key, title, glow, activeRing }) => {
                const active = activeCategory === key && isUnlocked;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectDomain(key)}
                    className={`group relative flex flex-1 flex-col items-start overflow-hidden rounded-2xl border p-4 sm:rounded-3xl sm:min-w-[17.5rem] sm:p-7 text-left text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      active ? `bg-slate-900/45 ring-2 ${activeRing}` : 'border-white/30 bg-slate-900/30'
                    } shadow-[0_20px_50px_-15px_rgba(15,23,42,0.55)]`}
                  >
                    {/* Soft coloured glow in the corner */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${glow} to-transparent blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70`}
                    />
                    {/* Editorial index instead of an icon */}
                    <div className="relative flex w-full items-center justify-between">
                      <span className="flex items-center gap-3 text-white">
                        {key === 'inhouse' ? (
                          <Brain weight="light" className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" aria-hidden />
                        ) : (
                          <Lightbulb weight="light" className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" aria-hidden />
                        )}
                      </span>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>

                    <h3 className="relative mt-4 sm:mt-7 whitespace-nowrap font-display text-[1.1rem] sm:text-[1.35rem] sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.3)]">
                      {title}
                    </h3>
                  </button>
                );
              })}
            </div>
            </Reveal>
          </motion.div>
        </ScrollExpand>

        {/* Dark veil over the photo while the map is open */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: isUnlocked ? 1 : 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-10 bg-black/35 backdrop-blur-[10px]"
        />

        {/* Map workspace: rises in over the same photo */}
        <motion.div
          id="treasure-map-section"
          initial={false}
          animate={{ opacity: isUnlocked ? 1 : 0 }}
          transition={{ duration: 0.5, delay: isUnlocked ? 0.1 : 0 }}
          style={{ pointerEvents: isUnlocked ? 'auto' : 'none' }}
          inert={!isUnlocked}
          className="absolute inset-x-0 top-0 z-20 h-[calc(100svh-4rem)] overflow-y-auto pt-3 pb-6 sm:h-[calc(100svh-5rem)] sm:pt-4 lg:h-[calc(100svh-6rem)] lg:overflow-hidden lg:pt-5"
        >
        {/* Back arrow + current domain title, domain switch and journey progress */}
        <div className="relative mx-auto mb-2 flex w-full max-w-[1720px] flex-wrap items-center gap-x-3 gap-y-2 px-3 sm:mb-3 sm:gap-x-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleReturnToHero}
            aria-label="Back to Projects"
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Domain switch (segmented) */}
          <div role="tablist" aria-label="Project domain" className="flex items-center rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md">
            {(
              [
                { key: 'inhouse', label: 'In-House' },
                { key: 'students', label: 'Students' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeCategory === key}
                onClick={() => setActiveCategory(key)}
                className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 font-display text-xs sm:text-sm font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  activeCategory === key
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Journey progress */}
          {realCount > 0 && selectedIndex >= 0 && (
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-wider text-white">
                {String(selectedIndex + 1).padStart(2, '0')}
                <span className="text-white/50"> / {String(realCount).padStart(2, '0')}</span>
              </span>
              <span className="relative hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/20 sm:block">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[#dc2626] transition-[width] duration-500 ease-out"
                  style={{ width: `${((selectedIndex + 1) / realCount) * 100}%` }}
                />
              </span>
            </div>
          )}
        </div>

        {/* ── 2-COLUMN SPLIT EXPEDITION VIEW: MAP ON LEFT, RICH CONTENT ON RIGHT ── */}
        <div className="relative mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">
          <div
            ref={rowRef}
            className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8"
          >
            {/* ── MAP COLUMN: Put down on mobile (order-2), left on desktop (lg:order-1) ── */}
            <motion.div
              initial={false}
              animate={isUnlocked ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: isUnlocked ? 0.2 : 0 }}
              className={`order-2 lg:order-1 relative w-full min-w-0 lg:shrink-0 lg:transition-[flex-basis] lg:duration-[900ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                expanded ? 'lg:basis-[7rem]' : 'lg:basis-[calc(41.667%-0.8rem)]'
              }`}
            >
              {/* Minimap: the map shrinks into the top-left corner, like a game HUD */}
              <motion.button
                type="button"
                onClick={() => setExpanded(false)}
                initial={false}
                animate={expanded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                transition={{ duration: expanded ? 0.6 : 0.18, delay: expanded ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: '0% 0%', aspectRatio: '1024 / 1536', pointerEvents: expanded ? 'auto' : 'none' }}
                tabIndex={expanded ? 0 : -1}
                aria-label="Back to the full map"
                title="Back to the full map"
                className={`group/mini relative lg:hidden left-0 top-0 z-[60] w-full max-w-[9rem] overflow-hidden rounded-2xl border-2 border-white/70 bg-[#efe3cb] shadow-[0_12px_30px_-6px_rgba(0,0,0,0.7)] transition-shadow hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.85)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer ${expanded ? '' : 'max-lg:hidden'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MAP_SRC[activeCategory]}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-fill"
                />
                {WAYPOINTS.slice(0, Math.max(0, selectedIndex % WAYPOINTS.length)).map((wp, i) => (
                  <span
                    key={i}
                    className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 ring-1 ring-black/40"
                    style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                  />
                ))}
                {selectedWaypoint && (
                  <span
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                    style={{ left: `${selectedWaypoint.x}%`, top: `${selectedWaypoint.y}%` }}
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/mini:opacity-100">
                  Back to map
                </span>
              </motion.button>

              <motion.div
                initial={false}
                animate={{ scale: expanded && mapW > 0 ? miniScale : 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  transformOrigin: '0% 0%',
                  width: mapW > 0 ? mapW : undefined,
                  pointerEvents: expanded ? 'none' : 'auto',
                }}
                className={`relative ${expanded ? 'max-lg:hidden' : ''}`}
              >
              {/* Scroll hint: fades out once the journey begins */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-3 sm:top-4 lg:top-[5.6rem] z-[60] flex justify-end px-3 sm:px-4 transition-all duration-500 ${
                  selectedIndex === 0 && !expanded ? 'opacity-100 translate-y-0 lg:delay-[500ms]' : 'opacity-0 -translate-y-2'
                }`}
              >
                <span className="flex items-center gap-1.5 rounded-full border border-[#cfba9e]/80 bg-[#fffdfa]/95 px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#3d2312] shadow-lg backdrop-blur-md">
                  Scroll to explore
                  <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-bounce" />
                </span>
              </div>
              <div
                ref={mapContainerRef}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className={`relative w-full h-[225px] xs:h-[255px] sm:h-[300px] lg:h-[clamp(420px,calc(100dvh-13rem),760px)] overflow-y-hidden overscroll-contain rounded-2xl sm:rounded-3xl border border-white/25 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] bg-[#efe3cb] [&::-webkit-scrollbar]:hidden`}
              >
                {/* Traveler: red marker that walks the trail between waypoints */}
                <div
                  ref={travelerRef}
                  aria-hidden="true"
                  style={{ opacity: 0 }}
                  className="pointer-events-none absolute left-0 top-0 z-50 h-4 w-4 sm:h-[18px] sm:w-[18px] rounded-full border-2 border-white bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.6)] [will-change:transform]"
                />
                {Array.from({ length: tileCount }).map((_, tileIndex) => {
                  const tileProjects = displayedProjects.slice(
                    tileIndex * WAYPOINTS.length,
                    (tileIndex + 1) * WAYPOINTS.length,
                  );

                  // The final extra tile is cropped to just past its last node, so the map grows
                  // only as much as needed for each new project.
                  const isLastTile = tileIndex === tileCount - 1;
                  const cropFraction =
                    isLastTile && tileIndex > 0
                      ? Math.min(
                          1,
                          (WAYPOINTS[Math.max(0, tileProjects.length - 1)].y + TILE_TAIL_PADDING) / 100,
                        )
                      : 1;
                  const isCropped = cropFraction < 1;

                  return (
                    <div
                      key={tileIndex}
                      style={{ aspectRatio: `1024 / ${1536 * cropFraction}` }}
                      className={`relative w-full overflow-y-clip ${
                        tileIndex > 0 ? '-mt-2 sm:-mt-3 md:-mt-4' : ''
                      }`}
                    >
                      {/* High-resolution atlas for this segment (clipped when cropped) */}
                      <div className="absolute inset-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={MAP_SRC[activeCategory]}
                          alt={`BrainX Expedition Map Segment ${tileIndex + 1}`}
                          draggable={false}
                          className="block w-full aspect-[1024/1536] object-fill pointer-events-none select-none"
                        />
                      </div>

                      {/* Soft parchment fade where the cropped map ends */}
                      {isCropped && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 select-none"
                          style={{
                            background:
                              'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.95))',
                          }}
                        />
                      )}

                      {/* Seamless Parchment Soft Blend between consecutive maps */}
                      {tileIndex > 0 && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 z-15 h-6 select-none"
                          style={{
                            background:
                              'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.45) 50%, transparent)',
                          }}
                        />
                      )}

                      {/* Pins are positioned against the FULL tile height, independent of cropping */}
                      <div className="absolute inset-x-0 top-0 w-full aspect-[1024/1536]">
                      {/* Waypoint Pins on the Map Trail */}
                      {tileProjects.map((project, localIdx) => {
                        const globalIdx = tileIndex * WAYPOINTS.length + localIdx;
                        const waypoint = WAYPOINTS[localIdx];
                        const isSelected = selectedProjectId === project.id;
                        const isVisible = globalIdx <= selectedIndex;

                        return (
                          <MapWaypointPin
                            key={project.id}
                            id={`map-waypoint-${globalIdx}`}
                            project={project}
                            index={globalIdx}
                            waypoint={waypoint}
                            isSelected={isSelected}
                            isVisible={isVisible}
                            onSelect={() => handleSelectWaypoint(project.id)}
                          />
                        );
                      })}
                      </div>
                    </div>
                  );
                })}
              </div>
              </motion.div>

              {/* Click target over the scaled-down map: returns to the full map */}
              {expanded && mapW > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Back to the full map"
                  title="Back to the full map"
                  style={{ width: MINI_W, height: Math.round(mapH * miniScale) }}
                  className="absolute left-0 top-0 z-[70] hidden rounded-2xl ring-2 ring-white/0 transition hover:ring-white/70 focus:outline-none focus-visible:ring-white cursor-pointer lg:block"
                />
              )}
            </motion.div>

            {/* ── DETAIL PANEL COLUMN: Put up on mobile (order-1), right on desktop (lg:order-2) ── */}
            <motion.div
              id="project-detail-panel"
              initial={false}
              animate={isUnlocked ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: isUnlocked ? 0.35 : 0 }}
              className="order-1 lg:order-2 min-w-0 w-full lg:flex-1 lg:sticky lg:top-8 min-h-[380px] xs:min-h-[410px] sm:min-h-[440px] sm:h-[460px] lg:h-[clamp(420px,calc(100dvh-13rem),760px)]"
            >
              <ProjectDetailPanel
                project={selectedProject}
                team={team}
                expanded={expanded}
                onExpand={selectedProject ? () => setExpanded((v) => !v) : undefined}
                nextTitle={
                  realCount > 0 && selectedIndex >= 0 && selectedIndex < displayedProjects.length - 1
                    ? getProjectShortTitle(displayedProjects[selectedIndex + 1])
                    : undefined
                }
                onNext={
                  realCount > 0 && selectedIndex >= 0 && selectedIndex < displayedProjects.length - 1
                    ? handleNextProject
                    : undefined
                }
              />
            </motion.div>
          </div>
        </div>
        </motion.div>
      </section>

      {/* ── 3. FULL SCREEN SLIDESHOW FIELD JOURNAL MODAL ── */}
      {activeProjectModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="field-journal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1c1917]/75 backdrop-blur-xs transition-opacity"
            onClick={closeSlidesModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#d6c4a8] bg-[#ffffff] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e8d7bd] bg-[#fbf7ee] px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#8c532b]" />
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider ${
                    activeProjectModal.category === 'students' || activeProjectModal.category === 'student'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                  }`}
                >
                  {activeProjectModal.category === 'students' || activeProjectModal.category === 'student'
                    ? 'Student Prototype'
                    : 'In-House Platform'}
                </span>
                <span className="font-mono text-xs text-[#8c532b] hidden sm:inline">
                  · Field Journal Slides
                </span>
              </div>

              <button
                type="button"
                onClick={closeSlidesModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#786149] hover:bg-[#ede1ce] hover:text-[#1c1917] transition-colors cursor-pointer"
                aria-label="Close field journal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-6">
              {/* Slideshow Area */}
              <div className="relative overflow-hidden rounded-2xl border border-[#d6c4a8] bg-[#1c1917]">
                <div className="relative aspect-[16/9] w-full">
                  {modalImages.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={modalImages[slideIndex]}
                      alt={`${activeProjectModal.title} slide ${slideIndex + 1}`}
                      className="h-full w-full object-cover transition-opacity duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                      <ImageIcon className="h-10 w-10 text-[#9c8267]" />
                      <span className="mt-3 font-mono text-xs text-[#d6c4a8]">
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs transition hover:bg-white hover:text-black cursor-pointer"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs transition hover:bg-white hover:text-black cursor-pointer"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Slide indicator dots */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-1.5 bg-[#1c1917] py-2.5">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIndex(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
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
                  id="field-journal-title"
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]"
                >
                  {activeProjectModal.title}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#44403c] sm:text-base">
                  {activeProjectModal.description}
                </p>
              </div>

              {/* Tags */}
              {activeProjectModal.tags && activeProjectModal.tags.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8c532b]">
                    Core Engineering Paradigms
                  </h4>
                  <div className="mt-2">
                    <TagList
                      tags={activeProjectModal.tags}
                      className="[&_li]:border-[#d9cbba] [&_li]:bg-[#faf5ec] [&_li]:text-[#5c442e]"
                    />
                  </div>
                </div>
              )}

              {/* Team Members */}
              {activeProjectModal.members && activeProjectModal.members.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#8c532b]">
                    Expedition Researchers &amp; Engineers
                  </h4>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {activeProjectModal.members.map((memberName) => {
                      const resolved = findTeamMember(memberName, team);
                      return (
                        <div
                          key={memberName}
                          className="flex items-center gap-3 rounded-xl border border-[#e8d7bd] bg-[#fdfaf5] p-2.5"
                        >
                          {resolved?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolved.image}
                              alt={memberName}
                              className="h-10 w-10 rounded-full object-cover border border-[#d6c4a8]"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3a2211] text-xs font-bold text-[#faf5ec]">
                              {getInitials(memberName)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1c1917]">
                              {memberName}
                            </p>
                            {resolved?.role && (
                              <p className="truncate text-xs text-[#786149]">
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
              {activeProjectModal.link && (
                <div className="pt-2">
                  <a
                    href={activeProjectModal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3a2211] px-5 py-2.5 text-sm font-semibold text-[#fffdfa] shadow-xs transition hover:bg-[#5c371d]"
                  >
                    <span>Inspect Publication / Code Repository</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
