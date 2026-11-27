import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from './App'
import { I18nProvider } from '@/i18n/I18nProvider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { SyncProvider } from '@/features/sync/SyncProvider'
import { LearnProgressProvider } from '@/features/learn/LearnProgressProvider'
import { TimerStoreProvider } from '@/features/timer/TimerStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        {/* Times and lesson progress: this device for guests, synced to the account when signed in. */}
        <SyncProvider>
          <LearnProgressProvider>
            <TimerStoreProvider>
              <App />
            </TimerStoreProvider>
          </LearnProgressProvider>
        </SyncProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)
