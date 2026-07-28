import { useEffect, useState } from 'react';
import type { Note, Paragraph, LangCode } from '@/types';
import { ParagraphMenu } from './ParagraphMenu';
import { NoteEditor } from './NoteEditor';

/**
 * Renders a single paragraph with its kind-specific typography.
 *
 * Phase 2 additions:
 *   - A small popover (划线 / 笔记 / 关闭) appears when the user taps or
 *     focuses the paragraph. It is wired to the highlight toggle and the
 *     inline note editor.
 *   - When a note exists, it is rendered inline below the paragraph in
 *     'view' mode (with edit / delete actions). Tapping 笔记 transitions
 *     the inline editor into 'create' or 'edit' mode.
 *   - When the paragraph is highlighted, a soft moss background is applied.
 *
 * The parent (Reader) owns the canonical Highlight[] / Note[] arrays and
 * persists them via src/lib/storage. The component emits intent events;
 * it does not touch storage directly.
 */
type NoteState =
  | { kind: 'none' }
  | { kind: 'view'; note: Note }
  | { kind: 'create' }
  | { kind: 'edit'; note: Note };

export function ParagraphView({
  p,
  lang,
  compact = false,
  isHighlighted = false,
  note,
  onToggleHighlight,
  onSaveNote,
  onDeleteNote,
}: {
  p: Paragraph;
  lang: LangCode;
  compact?: boolean;
  isHighlighted?: boolean;
  note?: Note;
  onToggleHighlight: () => void;
  onSaveNote: (text: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [noteState, setNoteState] = useState<NoteState>(
    note ? { kind: 'view', note } : { kind: 'none' },
  );

  // When the parent updates the note (e.g. after async storage load),
  // make sure our local state reflects it — without clobbering a user
  // who is currently editing.
  useEffect(() => {
    if (noteState.kind === 'view') {
      if (note && note.id !== noteState.note.id) {
        setNoteState({ kind: 'view', note });
      } else if (!note) {
        setNoteState({ kind: 'none' });
      }
    } else if (noteState.kind === 'edit') {
      if (note && note.id !== noteState.note.id) {
        setNoteState({ kind: 'edit', note });
      } else if (!note) {
        setNoteState({ kind: 'none' });
      }
    } else if (noteState.kind === 'create') {
      if (note) setNoteState({ kind: 'view', note });
    } else if (noteState.kind === 'none') {
      if (note) setNoteState({ kind: 'view', note });
    }
    // We intentionally do not depend on noteState so we don't loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  if (p.kind === 'heading') {
    return (
      <h2
        data-para-id={p.id}
        className={[
          'font-serif-cn font-medium text-ink dark:text-dark-ink',
          compact ? 'text-lg mt-4 mb-1' : 'text-2xl mt-12 mb-4',
        ].join(' ')}
      >
        {p.text}
      </h2>
    );
  }

  const openNoteEditor = () => {
    setPopoverOpen(false);
    setNoteState(note ? { kind: 'edit', note } : { kind: 'create' });
  };

  return (
    <div data-para-id={p.id} className="group relative">
      <p
        onClick={() => setPopoverOpen((o) => !o)}
        className={[
          lang === 'zh-CN' ? 'para-zh' : 'para-en',
          compact ? 'text-base my-1 leading-relaxed' : 'text-body-lg my-5',
          isHighlighted
            ? 'rounded px-1 -mx-1 bg-moss/15 dark:bg-moss/25 transition-colors duration-220'
            : '',
        ].join(' ')}
      >
        {p.text}
      </p>

      <ParagraphMenu
        open={popoverOpen && noteState.kind !== 'create' && noteState.kind !== 'edit'}
        highlighted={isHighlighted}
        hasNote={Boolean(note)}
        onToggleHighlight={onToggleHighlight}
        onOpenNote={openNoteEditor}
        onClose={() => setPopoverOpen(false)}
      />

      {(noteState.kind === 'view' || noteState.kind === 'create' || noteState.kind === 'edit') && (
        <div data-para-note={p.id}>
          <NoteEditor
            mode={noteState.kind}
            initial={noteState.kind === 'edit' ? noteState.note : note}
            onSave={(text) => {
              onSaveNote(text);
              // After save, the parent re-renders with the saved note and
              // our effect above flips the state to 'view'. No manual flip
              // needed here.
            }}
            onDelete={() => {
              if (noteState.kind === 'edit') {
                onDeleteNote(noteState.note.id);
                setNoteState({ kind: 'none' });
              } else if (note) {
                onDeleteNote(note.id);
                setNoteState({ kind: 'none' });
              }
            }}
            onEdit={() => note && setNoteState({ kind: 'edit', note })}
            onClose={() => note && setNoteState({ kind: 'view', note })}
            onCancel={() => {
              if (note) {
                setNoteState({ kind: 'view', note });
              } else {
                setNoteState({ kind: 'none' });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
