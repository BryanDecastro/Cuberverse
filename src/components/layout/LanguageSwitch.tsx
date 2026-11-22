import { locales, useI18n, type Locale } from '@/i18n/I18nProvider'
import { cx } from '@/lib/format'

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  return (
    <div role="group" aria-label={t.nav.language} className={cx('inline-flex rounded-lg border border-line bg-panel/60 p-0.5', className)}>
      {(Object.keys(locales) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          title={locales[l].meta.langName}
          className={cx(
            'h-8 min-w-9 rounded-md px-2 font-mono text-[0.7rem] font-medium tracking-wider transition-colors duration-300',
            locale === l ? 'bg-accent/20 text-ink' : 'text-ink-3 hover:text-ink',
          )}
        >
          {locales[l].meta.short}
        </button>
      ))}
    </div>
  )
}
