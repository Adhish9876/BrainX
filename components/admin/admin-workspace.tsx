'use client';

import * as React from 'react';
import {
  Calendar,
  CheckCircle2,
  FileText,
  FlaskConical,
  FolderKanban,
  Images,
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
import { SiteSettingsForm } from './site-settings-form';

type SectionKey = 'site' | Collection;

const SECTION_ICONS: Record<SectionKey, React.ComponentType<{ className?: string }>> = {
  site: Settings,
  publications: FileText,
  team: Users,
  research: FlaskConical,
  projects: FolderKanban,
  events: Calendar,
  news: Newspaper,
  pictures: Images,
};

const SECTION_ORDER: SectionKey[] = ['site', ...COLLECTIONS];

function sectionLabel(section: SectionKey): string {
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

  const [section, setSection] = React.useState<SectionKey>('site');
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
            error instanceof ApiError
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
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-navy-700 text-sm font-semibold text-white">
              BX
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">BrainX Lab</p>
              <p className="text-xs text-slate-600">Content admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploadInFlight ? (
              <Badge variant="secondary" className="hidden items-center gap-1 sm:inline-flex">
                <Loader2 className="size-3 animate-spin" />
                Uploading…
              </Badge>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={requestLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1" aria-label="Admin sections">
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
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2',
                    active
                      ? 'bg-navy-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <Icon className="size-4" />
                  {sectionLabel(key)}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-32">
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
            <Alert variant="success" className="mb-4">
              <CheckCircle2 />
              <AlertTitle>Changes committed</AlertTitle>
              <AlertDescription>
                <p>
                  Your content was committed{shortSha(publishState.result.sha)}. The
                  public site will update once the deployment build finishes — it is
                  not live yet.
                </p>
                {publishState.result.url ? (
                  <a
                    href={publishState.result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-medium text-emerald-700 underline underline-offset-2"
                  >
                    View commit
                  </a>
                ) : null}
              </AlertDescription>
            </Alert>
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

          {activeSection === 'site' ? (
            <section aria-label="Site settings" className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Site settings</h2>
                <p className="text-sm text-slate-600">
                  Lab identity and contact details shown across the public site.
                </p>
              </div>
              <Separator />
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
              />
            </section>
          )}
        </main>
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

function shortSha(sha: string): string {
  if (!sha) return '';
  return ` (${sha.slice(0, 7)})`;
}

export function AdminWorkspace({ onLogout }: { onLogout: () => void }) {
  return <AdminContentLoader onLogout={onLogout} render={(data) => <ContentManager initial={data} onLogout={onLogout} />} />;
}
