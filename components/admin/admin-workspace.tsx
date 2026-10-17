'use client';

import * as React from 'react';
import {
  Calendar,
  CheckCircle2,
  FileText,
  FlaskConical,
  FolderKanban,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  Newspaper,
  RefreshCw,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import {
  ApiError,
  ConflictError,
  commit,
  getContent,
  logout,
  uploadFile,
  type CommitResult,
  type RemoteContent,
} from './lib/api';
import {
  COLLECTIONS,
  COLLECTION_LABELS,
  type Collection,
  type RecordValue,
} from './lib/content-types';
import {
  addRecord,
  createRecord,
  moveRecord,
  removeRecord,
  replaceRecord,
  updateSite,
} from './lib/content';
import { diffContent } from './lib/diff';
import { clearDraft, readDraft, writeDraft } from './lib/draft';
import { validateContent, type ValidationIssue } from '@/lib/validation';
import { AdminContentLoader } from './admin-content-loader';
import { ChangesBar } from './changes-bar';
import { CollectionSection } from './collection-section';
import { ConfirmDialog } from './confirm-dialog';
import { RecordEditor } from './record-editor';
import { Overview } from './overview';
import { SiteSettingsForm } from './site-settings-form';
import { motion } from 'motion/react';

type SectionKey = 'overview' | 'site' | Collection;

const SECTION_ICONS: Record<SectionKey, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  site: Settings,
  publications: FileText,
  team: Users,
  research: FlaskConical,
  projects: FolderKanban,
  events: Calendar,
  news: Newspaper,
  pictures: Images,
};

const SECTION_ORDER: SectionKey[] = ['overview', 'site', ...COLLECTIONS];

function sectionLabel(section: SectionKey): string {
  if (section === 'overview') return 'Overview';
  return section === 'site' ? 'Site settings' : COLLECTION_LABELS[section];
}

function recordsOf(content: RemoteContent['content'], collection: Collection): RecordValue[] {
  return content[collection] as unknown as RecordValue[];
}

type PublishState =
  | { kind: 'idle' }
  | { kind: 'success'; result: CommitResult }
  | { kind: 'invalid'; issues: ValidationIssue[] }
  | { kind: 'error'; message: string };

interface EditingState {
  collection: Collection;
  record: RecordValue;
  isNew: boolean;
}

interface ContentManagerProps {
  initial: RemoteContent;
  onLogout: () => void;
}

function ContentManager({ initial, onLogout }: ContentManagerProps) {
  const [storedDraft] = React.useState(() => readDraft());

  const [remote, setRemote] = React.useState<RemoteContent>(initial);
  const [draft, setDraft] = React.useState(() => storedDraft?.content ?? initial.content);
  const [baseSha, setBaseSha] = React.useState(() => storedDraft?.baseSha ?? initial.sha);
  const [restored, setRestored] = React.useState(() => storedDraft !== null);
  const [staleDraft, setStaleDraft] = React.useState(
    () => storedDraft !== null && storedDraft.baseSha !== initial.sha,
  );

  const [section, setSection] = React.useState<SectionKey>('overview');
  const [editing, setEditing] = React.useState<EditingState | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [uploading, setUploading] = React.useState(0);
  const [publishState, setPublishState] = React.useState<PublishState>({ kind: 'idle' });
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [conflictOpen, setConflictOpen] = React.useState(false);
  const [draftStorageUnavailable, setDraftStorageUnavailable] = React.useState(false);

  const changes = React.useMemo(
    () => diffContent(remote.content, draft),
    [remote, draft],
  );
  const dirty = changes.length > 0;
  const uploadInFlight = uploading > 0;
  const busy = publishing || uploadInFlight;

  // Persist the working draft (debounced) so a refresh keeps edits and baseSha.
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      if (dirty) {
        setDraftStorageUnavailable(!writeDraft({ baseSha, content: draft, savedAt: Date.now() }));
      } else {
        clearDraft();
        setDraftStorageUnavailable(false);
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [draft, baseSha, dirty]);

  // Warn before leaving with unsaved changes, and flush the draft first.
  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      writeDraft({ baseSha, content: draft, savedAt: Date.now() });
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, draft, baseSha]);

  const handleUpload = React.useCallback(async (file: File): Promise<string> => {
    setUploading((count) => count + 1);
    try {
      return await uploadFile(file);
    } finally {
      setUploading((count) => Math.max(0, count - 1));
    }
  }, []);

  const applyRemote = React.useCallback((fresh: RemoteContent) => {
    setRemote(fresh);
    setDraft(fresh.content);
    setBaseSha(fresh.sha);
    setRestored(false);
    setStaleDraft(false);
    clearDraft();
  }, []);

  const resetDraft = () => {
    applyRemote(remote);
    setPublishState({ kind: 'idle' });
  };

  const loadLatest = async () => {
    try {
      const fresh = await getContent();
      applyRemote(fresh);
      setConflictOpen(false);
      setPublishState({ kind: 'idle' });
    } catch {
      setPublishState({
        kind: 'error',
        message: 'Could not fetch the latest published version. Please try again.',
      });
    }
  };

  const publish = async () => {
    if (publishing || uploadInFlight) return;

    const check = validateContent(draft);
    if (!check.ok) {
      setPublishState({ kind: 'invalid', issues: check.issues });
      return;
    }

    setPublishing(true);
    setPublishState({ kind: 'idle' });
    try {
      const result = await commit(draft, baseSha);
      // The server returns the exact normalized content it committed. A second
      // network failure must not make an accepted commit look like a failure.
      const fresh = result.content ? { content: result.content, sha: result.sha } : await getContent();
      applyRemote(fresh);
      setPublishState({ kind: 'success', result });
    } catch (error) {
      if (error instanceof ConflictError) {
        setConflictOpen(true);
      } else if (error instanceof ApiError && error.status === 401) {
        setPublishState({
          kind: 'error',
          message: 'Your session expired. Please sign in again.',
        });
        writeDraft({ baseSha, content: draft, savedAt: Date.now() });
        onLogout();
      } else {
        setPublishState({
          kind: 'error',
          message:
            error instanceof ApiError && error.code === 'github_error' && (error.status === 403 || error.status === 401)
              ? 'GitHub refused the commit: the access token (GITHUB_PAT) is not allowed to write to the repository. Give the token “Contents: Read and write” access to this repo, restart the server, and publish again. Your draft is safe.'
              : error instanceof ApiError
                ? 'The server rejected the publish request. Your draft is safe — fix the issue and try again.'
                : 'Could not reach the server. Your draft is safe — try again.',
        });
      }
    } finally {
      setPublishing(false);
    }
  };

  const doLogout = async () => {
    try {
      await logout();
    } catch {
      setPublishState({ kind: 'error', message: 'Could not sign out. Your session is still active; please try again.' });
      return;
    }
    clearDraft();
    onLogout();
  };

  const requestLogout = () => {
    if (dirty) setConfirmLogout(true);
    else void doLogout();
  };

  const openNew = (collection: Collection, initialOverrides?: Partial<RecordValue>) => {
    setEditing({
      collection,
      record: createRecord(collection, initialOverrides),
      isNew: true,
    });
  };

  const openEdit = (collection: Collection, id: string) => {
    const record = recordsOf(draft, collection).find((item) => String(item.id) === id);
    if (record) setEditing({ collection, record, isNew: false });
  };

  const saveRecord = (record: RecordValue) => {
    const current = editing;
    if (!current) return;
    const { collection, isNew } = current;
    setDraft((prev) =>
      isNew
        ? addRecord(prev, collection, record)
        : replaceRecord(prev, collection, String(record.id), record),
    );
    setEditing(null);
  };

  const activeSection = section;

  return (
    <div className="min-h-dvh bg-[#f4f5f7] text-slate-900 lg:flex">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="hidden w-72 shrink-0 flex-col bg-[#0e1a33] text-white lg:flex lg:sticky lg:top-0 lg:h-dvh">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brainx_lab_logo_solid.png" alt="" className="h-11 w-auto shrink-0 object-contain" />
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight">BrainX Lab</p>
            <p className="text-sm text-white/60">Website admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin sections">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Manage</p>
          <div className="space-y-0.5">
            {SECTION_ORDER.map((key) => {
              const Icon = SECTION_ICONS[key];
              const active = key === activeSection;
              const count = key === 'site' || key === 'overview' ? null : recordsOf(draft, key).length;
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setSection(key)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.95rem] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                    active
                      ? 'bg-white/12 font-semibold text-white'
                      : 'font-medium text-white/75 hover:bg-white/8 hover:text-white',
                  )}
                >
                  <Icon className={cn('size-[1.15rem] shrink-0', active ? 'text-white' : 'text-white/55')} />
                  <span className="flex-1">{sectionLabel(key)}</span>
                  {count !== null ? (
                    <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums', active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70')}>
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.95rem] font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white"
          >
            View website
            <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={requestLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[0.95rem] font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-50"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar (mobile: brand + sign out; desktop: upload status only) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8 lg:hidden">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brainx_lab_logo.png" alt="" className="h-9 w-auto shrink-0 object-contain" />
            <p className="text-base font-semibold">BrainX Lab admin</p>
          </div>
          <div className="flex items-center gap-2">
            {uploadInFlight ? <Loader2 className="size-4 animate-spin text-slate-500" /> : null}
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={requestLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
        <main className="min-w-0 pb-32">
          {draftStorageUnavailable ? <Alert variant="destructive" className="mb-4"><AlertTitle>Draft persistence unavailable</AlertTitle><AlertDescription>This browser could not save your draft. Keep this tab open until you publish, or enable browser storage before refreshing.</AlertDescription></Alert> : null}
          {/* Mobile section navigation */}
          <div className="-mx-1 mb-4 overflow-x-auto pb-1 lg:hidden">
            <nav className="flex w-max gap-1 px-1" aria-label="Admin sections">
              {SECTION_ORDER.map((key) => {
                const Icon = SECTION_ICONS[key];
                const active = key === activeSection;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setSection(key)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700',
                      active
                        ? 'border-navy-700 bg-navy-700 text-white'
                        : 'border-slate-200 bg-white text-slate-700',
                    )}
                  >
                    <Icon className="size-4" />
                    {sectionLabel(key)}
                  </button>
                );
              })}
            </nav>
          </div>

          {publishState.kind === 'success' ? (
            <PublishSuccess key={publishState.result.sha || 'published'} />
          ) : null}

          {publishState.kind === 'error' ? (
            <Alert variant="destructive" className="mb-4">
              <TriangleAlert />
              <AlertTitle>Publish failed</AlertTitle>
              <AlertDescription>{publishState.message}</AlertDescription>
            </Alert>
          ) : null}

          {publishState.kind === 'invalid' ? (
            <Alert variant="destructive" className="mb-4">
              <TriangleAlert />
              <AlertTitle>Some fields need attention</AlertTitle>
              <AlertDescription>
                <p>
                  Fix these fields before publishing. Your draft is unchanged.
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5">
                  {publishState.issues.slice(0, 12).map((issue, index) => (
                    <li key={index}>
                      <span className="font-medium">{issue.path || 'content'}</span>
                      {': '}
                      {issue.message}
                    </li>
                  ))}
                </ul>
                {publishState.issues.length > 12 ? (
                  <p className="mt-1 text-xs">
                    …and {publishState.issues.length - 12} more.
                  </p>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          {staleDraft ? (
            <Alert variant="warning" className="mb-4">
              <TriangleAlert />
              <AlertTitle>A restored draft is out of date</AlertTitle>
              <AlertDescription>
                <p>
                  A local draft was restored, but the published version has changed
                  since it was saved. Review your changes, or load the latest
                  published version to start fresh.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setConfirmReset(true)}
                  >
                    <RefreshCw className="size-4" />
                    Discard draft &amp; load published
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : restored && dirty ? (
            <Alert variant="info" className="mb-4">
              <AlertDescription>
                Restored an unsaved draft from this browser tab.
              </AlertDescription>
            </Alert>
          ) : null}

          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
          {activeSection === 'overview' ? (
            <Overview
              content={draft}
              changeCount={changes.length}
              onOpen={(target) => setSection(target)}
              onNew={(collection) => {
                setSection(collection);
                openNew(collection);
              }}
            />
          ) : activeSection === 'site' ? (
            <section aria-label="Site settings" className="space-y-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Site settings</h2>
                <p className="mt-1 text-base text-slate-600">
                  Lab identity, contact details and home-page content shown across the public site.
                </p>
              </div>
              <SiteSettingsForm
                site={draft.site}
                onChange={(patch) => setDraft((prev) => updateSite(prev, patch))}
                onUpload={handleUpload}
                disabled={busy}
              />
            </section>
          ) : (
            <section aria-label={COLLECTION_LABELS[activeSection]} className="space-y-4">
              <CollectionSection
                collection={activeSection}
                records={recordsOf(draft, activeSection)}
                onNew={(initialOverrides) => openNew(activeSection, initialOverrides)}
                onEdit={(id) => openEdit(activeSection, id)}
                onDelete={(id) => setDraft((prev) => removeRecord(prev, activeSection, id))}
                onMove={(id, direction) =>
                  setDraft((prev) => moveRecord(prev, activeSection, id, direction))
                }
                disabled={busy}
                yearImages={draft.site.publicationYearImages ?? {}}
                onYearImage={(year, url) =>
                  setDraft((prev) => {
                    const next = { ...(prev.site.publicationYearImages ?? {}) };
                    if (url) next[String(year)] = url;
                    else delete next[String(year)];
                    return updateSite(prev, { publicationYearImages: next });
                  })
                }
                onUpload={handleUpload}
              />
            </section>
          )}
          </motion.div>
        </main>
        </div>
      </div>

      {editing ? (
        <RecordEditor
          key={`${editing.collection}:${String(editing.record.id)}`}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          collection={editing.collection}
          record={editing.record}
          teamMembers={draft.team}
          isNew={editing.isNew}
          disabled={busy}
          onSave={saveRecord}
          onUpload={handleUpload}
        />
      ) : null}

      <ChangesBar
        changes={changes}
        publishing={publishing}
        disabled={uploadInFlight}
        onReset={() => setConfirmReset(true)}
        onPublish={() => void publish()}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset your changes?"
        description="All staged changes will be discarded and the editor will return to the published version you loaded. This cannot be undone."
        confirmLabel="Reset changes"
        destructive
        onConfirm={() => {
          resetDraft();
          setConfirmReset(false);
        }}
      />

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Sign out with unsaved changes?"
        description="Your draft in this tab will be discarded. Signed-out drafts are cleared for security."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmLogout(false);
          void doLogout();
        }}
      />

      <ConfirmDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        title="Someone published newer changes"
        description="The published content changed while you were editing, so your draft was not committed. You can keep working on your changes or load the latest published version (which replaces your draft)."
        confirmLabel="Load latest published"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => void loadLatest()}
      />
    </div>
  );
}

/** How long the website usually takes to rebuild after a publish. */
const SITE_UPDATE_SECONDS = 75;

/** Plain-language result of a publish: success, a short countdown, then "the site is updated". */
function PublishSuccess() {
  const [left, setLeft] = React.useState(SITE_UPDATE_SECONDS);
  React.useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);
  const done = left <= 0;

  return (
    <Alert variant="success" className="mb-4">
      <CheckCircle2 />
      <AlertTitle>{done ? 'The website is updated' : 'Changes published'}</AlertTitle>
      <AlertDescription>
        {done ? (
          <p>Your changes are now live on the website. Refresh the site to see them.</p>
        ) : (
          <>
            <p>The website is updating and will show your changes in about a minute.</p>
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-emerald-200/70" aria-hidden="true">
              <div
                className="h-full rounded-full bg-emerald-600 transition-[width] duration-1000 ease-linear"
                style={{ width: `${((SITE_UPDATE_SECONDS - left) / SITE_UPDATE_SECONDS) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-emerald-800/80">About {left}s to go</p>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}


export function AdminWorkspace({ onLogout }: { onLogout: () => void }) {
  return <AdminContentLoader onLogout={onLogout} render={(data) => <ContentManager initial={data} onLogout={onLogout} />} />;
}
