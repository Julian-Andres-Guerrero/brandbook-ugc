import { Link } from 'react-router-dom'
import { PublicLayout } from '../../components/Layout'
import { useMeta } from '../../components/useMeta'
import { btn } from '../../components/ui'
import { useLang } from '../../lib/i18n'

export default function NotFound({ profile = false }: { profile?: boolean }) {
  const { t } = useLang()
  useMeta(profile ? t('profile_not_found') : '404', { noindex: true })
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{profile ? t('profile_not_found') : '404'}</h1>
        <p className="mt-2 text-muted">{profile ? t('profile_not_found_d') : 'Page not found / Página no encontrada'}</p>
        <Link to="/" className={`${btn.secondary} mt-6`}>{t('back_home')}</Link>
      </div>
    </PublicLayout>
  )
}
