import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nProvider'
import { routes } from '@/config/routes'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <section className="mx-auto flex min-h-[80svh] max-w-[720px] flex-col items-center justify-center px-4 pt-24 text-center">
      <p className="font-mono text-6xl font-medium text-[#8fb8ff]">404</p>
      <h1 className="mt-6 font-display text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="mt-3 text-lg text-ink-2">{t.notFound.text}</p>
      <ButtonLink to={routes.home} variant="secondary" className="mt-8" icon={<ArrowLeft size={18} aria-hidden="true" />}>
        {t.notFound.back}
      </ButtonLink>
    </section>
  )
}
