/**
 * Namespaced, failure-safe localStorage wrapper.
 * Private windows or blocked storage must never break the app.
 * Later, synced data (solves, progress) moves to Supabase; this stays for
 * per-device preferences and the offline cache.
 */
const PREFIX = 'cubeverse:'

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw == null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* storage unavailable: keep working in memory */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      /* ignore */
    }
  },
}
