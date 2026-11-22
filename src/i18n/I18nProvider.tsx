import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type Dictionary } from './en'
import { pt } from './pt'
import { storage } from '@/lib/storage'

export const locales = { en, pt } satisfies Record<string, Dictionary>
export type Locale = keyof typeof locales

const htmlLang: Record<Locale, string> = { en: 'en', pt: 'pt-BR' }

function detectLocale(): Locale {
  const saved = storage.get<Locale | null>('locale', null)
  if (saved && saved in locales) return saved
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt')) return 'pt'
  return 'en'
}

type I18nValue = { locale: Locale; t: Dictionary; setLocale: (l: Locale) => void }
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    storage.set('locale', l)
  }, [])

  useEffect(() => {
    document.documentElement.lang = htmlLang[locale]
  }, [locale])

  const value = useMemo(() => ({ locale, t: locales[locale], setLocale }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
