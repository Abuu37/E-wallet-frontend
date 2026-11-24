import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { strings, type Locale } from './strings'

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem('wp.locale') // a per-viewer convenience only
    if (saved === 'en' || saved === 'sw') return saved
  } catch { /* storage unavailable */ }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    document.documentElement.lang = l
    try { localStorage.setItem('wp.locale', l) } catch { /* ignore */ }
  }, [])

  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale,
    t: (key) => strings[locale][key] ?? strings.en[key] ?? key,
  }), [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useT(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside I18nProvider')
  return ctx
}
