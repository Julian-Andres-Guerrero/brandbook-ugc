import type { ReactNode } from 'react'
import { PublicLayout } from '../../components/Layout'
import { useMeta } from '../../components/useMeta'
import { LEGAL_LAST_UPDATED } from '../../config'
import { useLang } from '../../lib/i18n'

export type LegalDoc = { title: { en: string; es: string }; body: { en: ReactNode; es: ReactNode } }

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { lang } = useLang()
  useMeta(doc.title[lang])
  return (
    <PublicLayout>
      <article className="prose-legal mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">{doc.title[lang]}</h1>
        <p className="mt-1 text-sm">{lang === 'es' ? 'Última actualización' : 'Last updated'}: {LEGAL_LAST_UPDATED}</p>
        <p className="mt-1 text-xs">
          {lang === 'es'
            ? 'Este texto es una plantilla redactada para esta plataforma. Revísalo con un abogado antes de operar comercialmente.'
            : 'This text is a template written for this platform. Have it reviewed by a lawyer before commercial operation.'}
        </p>
        <div className="mt-6">{doc.body[lang]}</div>
      </article>
    </PublicLayout>
  )
}
