import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Note } from '@/types';

/**
 * Inline note editor shown beneath a paragraph.
 * - When `mode === 'create'`, the textarea starts empty and Save creates a note.
 * - When `mode === 'edit'`, the textarea is pre-filled with `initial.text` and
 *   Save updates the existing note.
 * - Delete is shown only in edit mode.
 *
 * Keyboard: Ctrl/Cmd+Enter saves, Escape cancels.
 */
export type NoteEditorMode = 'create' | 'edit' | 'view';

export interface NoteEditorProps {
  /** What state the editor is in. */
  mode: NoteEditorMode;
  /** Existing note when mode is 'edit' or 'view'. */
  initial?: Note;
  onSave: (text: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function NoteEditor({
  mode,
  initial,
  onSave,
  onDelete,
  onEdit,
  onCancel,
  onClose,
}: NoteEditorProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(initial?.text ?? '');

  // Sync draft text when switching from view to edit, or when initial changes.
  useEffect(() => {
    setText(initial?.text ?? '');
  }, [initial?.text, mode]);

  if (mode === 'view' && initial) {
    return (
      <div
        className="mt-2 rounded-card border border-moss/20 bg-moss/5
                   dark:bg-moss/10 px-3 py-2 text-sm"
      >
        <p className="whitespace-pre-wrap text-ink dark:text-dark-ink leading-relaxed">
          {initial.text}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onEdit}
            className="text-moss hover:text-cinnabar transition-colors duration-180"
          >
            {t('reader.editNote')}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-cinnabar hover:underline transition-colors duration-180"
            >
              {t('reader.deleteNote')}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-secondary dark:text-dark-secondary hover:underline transition-colors duration-180"
            >
              {t('common.done')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const isEdit = mode === 'edit';

  return (
    <div
      className="mt-2 rounded-card border border-moss/30 bg-moss/5
                 dark:bg-moss/10 p-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('reader.notePlaceholder')}
        rows={3}
        // Ctrl/Cmd+Enter saves; Escape cancels
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            if (text.trim()) onSave(text.trim());
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel?.();
          }
        }}
        autoFocus
        className="w-full resize-y rounded border border-ink/10 dark:border-dark-line
                   bg-white/60 dark:bg-dark-ink/5 px-2 py-1.5 text-sm leading-relaxed
                   text-ink dark:text-dark-ink placeholder:text-secondary
                   focus:outline-none focus:border-moss/50"
      />
      <div className="mt-2 flex items-center gap-2 text-xs">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => text.trim() && onSave(text.trim())}
          className="px-3 py-1 rounded bg-moss text-paper hover:bg-moss/90
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-180"
        >
          {t('reader.saveNote')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-secondary dark:text-dark-secondary
                     hover:text-ink dark:hover:text-dark-ink transition-colors duration-180"
        >
          {t('reader.cancelNote')}
        </button>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-cinnabar hover:underline transition-colors duration-180"
          >
            {t('reader.deleteNote')}
          </button>
        )}
      </div>
    </div>
  );
}
