import { useTranslation } from 'react-i18next';
import { useContentLang } from '@/hooks/useContentLang';
import type { LangCode } from '@/types';

const LANGS: { code: LangCode; label: string; short: string }[] = [
  { code: 'zh-CN', label: '中文', short: '中' },
  { code: 'en', label: 'English', short: 'EN' },
];

/**
 * Two-state toggle for content language.
 * Independent of UI language (see docs §5: "两种语言独立控制").
 */
export function ContentLangToggle() {
  const [lang, setLang] = useContentLang();
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('reader.languageSwitch')}
      className="inline-flex rounded-card border border-ink/10 dark:border-dark-line overflow-hidden"
    >
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(l.code)}
            className={[
              'px-3 py-1.5 text-sm transition-colors duration-180',
              active
                ? 'bg-ink text-paper dark:bg-dark-ink dark:text-dark-paper'
                : 'bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10',
            ].join(' ')}
          >
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
