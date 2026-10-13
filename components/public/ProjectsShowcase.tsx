'use client';

import * as React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Member, Project } from '@/lib/types';
import TagList from './TagList';

const PLACEHOLDER_PROJECTS: Project[] = [
  {
    id: 'placeholder-project-1',
    category: 'inhouse',
    title: 'Adaptive Motor-Imagery Brain–Computer Interface for Neuro-Rehabilitation',
    description:
      'Developing a non-invasive EEG decoding pipeline and real-time neurofeedback loop for assistive motor rehabilitation. This project combines subject-invariant spatial filtering, Riemannian geometry, and lightweight deep neural networks to translate motor imagery intentions into reliable control commands across sessions.',
    image: '',
    images: [],
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
    id: 'placeholder-project-2',
    category: 'inhouse',
    title: 'Multimodal Affective Computing & Cognitive Workload Monitoring System',
    description:
      'Investigating physiological and neural correlates of emotional states, stress, and cognitive fatigue using wearable EEG and peripheral biosignals. The project builds interpretable cross-subject emotion recognition models and real-time assessment interfaces for human–machine teaming.',
    image: '',
    images: [],
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
    id: 'placeholder-project-3',
    category: 'students',
    title: 'MindGlide: Low-Cost 3D-Printed BCI Prosthetic Hand with Hybrid EMG-EEG Feedback',
    description:
      'An open-source, affordable prosthetic hand actuated by 3D-printed tendons and controlled via continuous sensor fusion of forearm surface EMG and motor-cortex EEG potentials. Enables intuitive grip selection and dexterous pinch modes for amputees.',
    image: '',
    images: [],
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
    id: 'placeholder-project-4',
    category: 'students',
    title: 'NeuroSpeller: High-Speed P300 Brain Typing Interface for ALS Assistive Communication',
    description:
      'An ergonomic virtual keyboard leveraging steady-state visual evoked potentials (SSVEP) and P300 oddball paradigms, achieving high information transfer rates for non-verbal individuals and neurodegenerative rehabilitation.',
    image: '',
    images: [],
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

/**
 * Resolves a contributor string (name or member id) against the lab's `team`
 * collection, preferring a record that has an uploaded `image` when a person
 * appears in multiple roles.
 */
function findTeamMember(query: string, team: Member[]): Member | undefined {
  const trimmed = query.trim();
  if (!trimmed || team.length === 0) return undefined;
  const lower = trimmed.toLowerCase();

  // 1. Exact ID or exact case-insensitive name match
  const exactMatches = team.filter(
    (m) => m.id.toLowerCase() === lower || m.name.trim().toLowerCase() === lower,
  );
  if (exactMatches.length > 0) {
    return exactMatches.find((m) => Boolean(m.image?.trim())) ?? exactMatches[0];
  }

  // 2. Significant name-token match (handles "Dr. K. Kannadasan" <-> "Dr. KANNADASAN K", etc.)
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

function ProjectImagePlaceholder({
  index,
  title,
  slideBadge,
  slideCaption,
  large = false,
}: {
  index: number;
  title: string;
  slideBadge?: string;
  slideCaption?: string;
  large?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 text-center ${
        large ? 'min-h-[260px] sm:min-h-[340px]' : ''
      }`}
    >
      {/* Subtle scientific grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-ink shadow-2xs">
          {index % 2 === 0 ? (
            <ImageIcon className="h-6 w-6 text-navy-700" aria-hidden />
          ) : (
            <Layers className="h-6 w-6 text-navy-700" aria-hidden />
          )}
        </div>

        <span className="mt-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-crimson-600">
          {slideBadge ?? `Project 0${index + 1} · Visual`}
        </span>

        <p className="mt-1.5 max-w-sm font-display text-sm font-semibold text-ink sm:text-base">
          {slideCaption ?? title}
        </p>

        <span className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-slate-400">
          Upload project images via Admin Panel
        </span>
      </div>
    </div>
  );
}

function ProjectCardsList({
  items,
  isPlaceholder,
  categoryPrefix,
  isStudentSection,
  onOpenModal,
}: {
  items: Project[];
  isPlaceholder: boolean;
  categoryPrefix: string;
  isStudentSection: boolean;
  onOpenModal: (project: Project) => void;
}) {
  return (
    <div className="space-y-0">
      {items.map((project, index) => {
        const isImageRight = index % 2 === 0;
        const coverImage = project.image || (project.images && project.images[0]) || '';
        const hasNext = index < items.length - 1;

        return (
          <React.Fragment key={project.id}>
            <article
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
              className={`group relative z-10 flex cursor-pointer flex-col gap-6 rounded-2xl border border-slate-200/90 bg-surface p-5 shadow-[0_12px_34px_-10px_rgba(11,16,32,0.11),0_4px_14px_-3px_rgba(11,16,32,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_38px_-10px_rgba(11,16,32,0.15),0_6px_16px_-4px_rgba(11,16,32,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:p-7 md:items-stretch md:gap-9 md:p-8 ${
                isImageRight ? 'md:flex-row-reverse' : 'md:flex-row'
              }`}
            >
              {/* Image Side */}
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-transparent md:aspect-[4/3] md:w-80 lg:w-96">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <ProjectImagePlaceholder index={index} title={project.title} />
                )}
              </div>

              {/* Explanation Side */}
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                        isStudentSection ? 'text-emerald-700' : 'text-crimson-600'
                      }`}
                    >
                      {categoryPrefix} {String(index + 1).padStart(2, '0')}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] font-semibold ${
                        isStudentSection
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-sky-200 bg-sky-50 text-sky-800'
                      }`}
                    >
                      {isStudentSection ? 'Student Project' : 'In-House Project'}
                    </span>

                    {isPlaceholder ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-slate-500">
                        Placeholder Preview
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-2 font-display text-2xl font-bold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
                    {project.title}
                  </h3>

                  <p className="mt-3.5 text-sm leading-relaxed text-muted sm:text-base sm:leading-[1.75]">
                    {project.description}
                  </p>

                  {project.tags.length > 0 ? (
                    <TagList tags={project.tags} className="mt-4" />
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 pt-1">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-paper/80 px-4 py-2 text-xs font-semibold text-ink transition-all group-hover:border-ink group-hover:bg-ink group-hover:text-white sm:text-sm">
                    View project details
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>

                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink sm:text-sm"
                    >
                      View project <span className="sr-only">{project.title}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>

            {/* Single clean S-curve connector between consecutive project containers */}
            {hasNext ? (
              <div
                aria-hidden="true"
                className="relative z-0 flex h-14 w-full items-center justify-center md:h-20"
              >
                <svg
                  viewBox="0 0 1000 96"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <path
                    d={
                      isImageRight
                        ? 'M 780 0 C 780 50, 220 46, 220 96'
                        : 'M 220 0 C 220 50, 780 46, 780 96'
                    }
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                  />
                  <circle
                    cx={isImageRight ? 780 : 220}
                    cy={4}
                    r={3.5}
                    fill="#334155"
                  />
                  <circle
                    cx={isImageRight ? 220 : 780}
                    cy={92}
                    r={3.5}
                    fill="#334155"
                  />
                </svg>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
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
  const items = projects.length > 0 ? projects : PLACEHOLDER_PROJECTS;
  const isPlaceholder = projects.length === 0;

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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeProject, closeModal, goPrevSlide, goNextSlide]);

  const isModalStudent =
    activeProject?.category === 'students' || activeProject?.category === 'student';

  return (
    <>
      <div className="relative isolate space-y-12">
        {/* Category Pill Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Research &amp; Engineering Projects
            </h2>
            <p className="mt-1 text-sm text-muted">
              Explore faculty-led in-house investigations and innovative student capstone developments.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-200/90 bg-white p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'text-slate-600 hover:text-ink'
              }`}
            >
              All Projects ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inhouse')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'inhouse'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-ink'
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
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-ink'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Students ({studentProjects.length})
            </button>
          </div>
        </div>

        {/* ── SECTION 1: IN-HOUSE PROJECTS ── */}
        {(activeTab === 'all' || activeTab === 'inhouse') && (
          <section aria-labelledby="inhouse-projects-heading" className="space-y-6">
            <div className="flex flex-col gap-1.5 border-l-4 border-sky-600 pl-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Lab R&amp;D · In-House
                </span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-sky-800">
                  {inhouseProjects.length} {inhouseProjects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
              <h3
                id="inhouse-projects-heading"
                className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
              >
                In-House Research Projects
              </h3>
              <p className="max-w-2xl text-sm text-muted sm:text-base">
                Core neural engineering platforms, subject-invariant EEG decoders, and clinical neuro-rehabilitation systems led by BrainX Lab researchers.
              </p>
            </div>

            {inhouseProjects.length > 0 ? (
              <ProjectCardsList
                items={inhouseProjects}
                isPlaceholder={isPlaceholder}
                categoryPrefix="In-House"
                isStudentSection={false}
                onOpenModal={openModal}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted">
                No in-house projects published yet.
              </div>
            )}
          </section>
        )}

        {/* Visual Divider when viewing both sections */}
        {activeTab === 'all' && (
          <div aria-hidden="true" className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-500 shadow-2xs">
                Student &amp; Capstone Initiatives
              </span>
            </div>
          </div>
        )}

        {/* ── SECTION 2: STUDENT PROJECTS ── */}
        {(activeTab === 'all' || activeTab === 'students') && (
          <section aria-labelledby="student-projects-heading" className="space-y-6">
            <div className="flex flex-col gap-1.5 border-l-4 border-emerald-600 pl-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Student Innovation · Capstone
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-emerald-800">
                  {studentProjects.length} {studentProjects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
              <h3
                id="student-projects-heading"
                className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
              >
                Student Projects
              </h3>
              <p className="max-w-2xl text-sm text-muted sm:text-base">
                Innovative assistive prototypes, robotic neuro-prosthetics, and student-driven neuro-technological designs engineered at BrainX.
              </p>
            </div>

            {studentProjects.length > 0 ? (
              <ProjectCardsList
                items={studentProjects}
                isPlaceholder={isPlaceholder}
                categoryPrefix="Student"
                isStudentSection={true}
                onOpenModal={openModal}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted">
                No student projects published yet.
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── PROJECT DETAIL MODAL WITH TEAM & SLIDES ── */}
      {activeProject ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/70 backdrop-blur-xs transition-opacity"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
            {/* Header with Close */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 sm:px-8">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider ${
                    isModalStudent
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-sky-200 bg-sky-50 text-sky-800'
                  }`}
                >
                  {isModalStudent ? 'Student Project' : 'In-House Project'}
                </span>
                {isPlaceholder ? (
                  <span className="font-mono text-xs text-slate-400">· Demo Preview</span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close project modal"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-paper text-ink transition-colors hover:bg-slate-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
              {/* Media Carousel Stage */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900/5 p-3 sm:p-5">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-white shadow-inner sm:aspect-[16/8]">
                  {realImages.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={realImages[slideIndex]}
                      alt={`${activeProject.title} slide ${slideIndex + 1}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ProjectImagePlaceholder
                      index={slideIndex}
                      title={activeProject.title}
                      slideBadge={PLACEHOLDER_SLIDES[slideIndex]?.badge}
                      slideCaption={PLACEHOLDER_SLIDES[slideIndex]?.caption}
                      large
                    />
                  )}
                </div>

                {/* Slides Nav Controls */}
                {totalSlides > 1 ? (
                  <div className="mt-3 flex items-center justify-between pt-1">
                    <span className="font-mono text-xs font-medium text-slate-500">
                      Slide {slideIndex + 1} of {totalSlides}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={goPrevSlide}
                        aria-label="Previous slide"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-2xs transition-colors hover:bg-slate-100"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={goNextSlide}
                        aria-label="Next slide"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-2xs transition-colors hover:bg-slate-100"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Title & Overview */}
              <div className="mt-6">
                <h2
                  id="project-modal-title"
                  className="font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl"
                >
                  {activeProject.title}
                </h2>

                {activeProject.tags.length > 0 ? (
                  <TagList tags={activeProject.tags} className="mt-3.5" />
                ) : null}

                <div className="mt-5">
                  <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    About the Project
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted sm:text-base sm:leading-[1.8]">
                    {activeProject.description}
                  </p>
                </div>
              </div>

              {/* People Working in the Project (wired directly to Team records & photos) */}
              <div className="mt-7 border-t border-slate-200/80 pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-ink" aria-hidden />
                  <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
                    People Working on This Project
                  </h3>
                </div>

                {activeProject.members && activeProject.members.length > 0 ? (
                  <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                    {activeProject.members.map((personKey: string) => {
                      const matched = findTeamMember(personKey, team);
                      const displayName = matched?.name ?? personKey;
                      const displayRole = matched?.role ?? 'Project Contributor';
                      const displayPosition = matched?.position ?? '';
                      const displayImage = matched?.image?.trim() ?? '';

                      return (
                        <div
                          key={personKey}
                          className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-surface p-3 shadow-2xs"
                        >
                          {/* Portrait Image wired to Team Member's image from Admin Panel */}
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-transparent">
                            {displayImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={displayImage}
                                alt={displayName}
                                className="h-full w-full object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white text-center">
                                <span className="font-display text-xs font-bold tracking-wider text-navy-700">
                                  {getInitials(displayName)}
                                </span>
                                <User className="mt-0.5 h-2.5 w-2.5 text-slate-400" aria-hidden />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-bold text-ink sm:text-base">
                              {displayName}
                            </p>
                            <p className="truncate font-mono text-[0.68rem] font-medium text-crimson-600">
                              {displayRole}
                            </p>
                            {displayPosition ? (
                              <p className="truncate text-xs text-muted">
                                {displayPosition}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2.5 text-sm text-muted">
                    Project team members can be added via the Admin Panel under Projects.
                  </p>
                )}
              </div>

              {activeProject.link ? (
                <div className="mt-6 border-t border-slate-200/80 pt-5">
                  <a
                    href={activeProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Visit external project page
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
