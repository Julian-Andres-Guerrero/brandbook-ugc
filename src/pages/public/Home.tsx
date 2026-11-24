import { Link } from 'react-router-dom'
import { PublicLayout } from '../../components/Layout'
import { useMeta } from '../../components/useMeta'
import { btn } from '../../components/ui'
import { useLang } from '../../lib/i18n'

export default function Home() {
  const { t } = useLang()
  useMeta('', {})
  const features = [
    ['feat_public', 'feat_public_d'],
    ['feat_private', 'feat_private_d'],
    ['feat_tax', 'feat_tax_d'],
    ['feat_secure', 'feat_secure_d'],
  ] as const
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:pt-20">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t('hero_title')}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t('hero_sub')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/registro" className={btn.primary}>{t('hero_cta')}</Link>
          <Link to="/@julianguerrerooficial" className={btn.secondary}>{t('hero_example')}</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2" aria-label="Features">
        {features.map(([title, desc]) => (
          <div key={title} className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-semibold">{t(title)}</h2>
            <p className="mt-2 text-sm text-muted">{t(desc)}</p>
          </div>
        ))}
      </section>
    </PublicLayout>
  )
}
