import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabaseConfigured } from '@/lib/supabase'
import { fetchSnapshot, onOutboxChange, pendingOps, startRetries, type CloudSnapshot } from './cloud'

type SyncValue = {
  /** The signed-in account whose data is synced, or null (guest / demo: this device only). */
  userId: string | null
  /** What the account held when this session started (null while loading or offline). */
  snapshot: CloudSnapshot | null
  /** Changes still on their way to the account. */
  pending: number
  /** The account could not be reached; changes are kept on this device and sent later. */
  offline: boolean
}

const Ctx = createContext<SyncValue>({ userId: null, snapshot: null, pending: 0, offline: false })

/** Downloads the signed-in user's data once per sign-in and keeps the upload queue moving. */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = supabaseConfigured && user && !user.isDemo ? user.id : null
  const [snapshot, setSnapshot] = useState<CloudSnapshot | null>(null)
  const [snapshotFor, setSnapshotFor] = useState<string | null>(null)
  const [pending, setPending] = useState(0)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setSnapshot(null)
    setSnapshotFor(null)
    setOffline(false)
    if (!userId) {
      setPending(0)
      return
    }
    let alive = true
    let retry: number | undefined
    const load = (attempt: number) => {
      fetchSnapshot()
        .then((s) => {
          if (!alive) return
          setSnapshot(s)
          setSnapshotFor(userId)
          setOffline(false)
        })
        .catch((err) => {
          if (!alive) return
          console.warn('Could not load account data', err)
          setOffline(true)
          retry = window.setTimeout(() => load(attempt + 1), Math.min(60_000, 5_000 * 2 ** attempt))
        })
    }
    load(0)
    const count = () => setPending(pendingOps(userId).length)
    count()
    const off = onOutboxChange(count)
    const stop = startRetries(userId)
    return () => {
      alive = false
      window.clearTimeout(retry)
      off()
      stop()
    }
  }, [userId])

  return (
    <Ctx.Provider value={{ userId, snapshot: snapshotFor === userId ? snapshot : null, pending, offline }}>{children}</Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): SyncValue {
  return useContext(Ctx)
}
