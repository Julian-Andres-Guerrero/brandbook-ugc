import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PublicLayout } from '../../components/Layout'
import { NETWORK_LABEL, SocialIcon } from '../../components/SocialIcon'
import { Spinner } from '../../components/ui'
import { useMeta } from '../../components/useMeta'
import { avatarUrl } from '../../lib/auth'
import { serviceLabel, useLang, type DictKey } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import type { Campaign, Profile as P, SocialLink } from '../../lib/types'
import NotFound from './NotFound'

// Columnas públicas explícitas: aunque RLS ya protege, nunca pedimos más de lo necesario.
const PROFILE_COLS =
  'id, username, display_name, headline_en, headline_es, city, bio_en, bio_es, avatar_path, niches, services, contact_email, show_contact, is_public'

type Data = { profile: P; links: SocialLink[]; campaigns: Campaign[] }

const statusStyle: Record<Campaign['status'], string> = {
  completed: 'bg-ok/15 text-ok',
  published: 'bg-accent/15 text-accent',
  in_progress: 'bg-warn/15 text-warn',
}

export default function Profile() {
  const { handle = '' } = useParams()
  const username = handle.replace(/^@/, '').toLowerCase()
  const { lang, t } = useLang()
  const [data, setData] = useState<Data | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: profile } = await supabase.from('profiles').select(PROFILE_COLS).eq('username', username).eq('is_public', true).maybeSingle()
      if (!profile) return active && setData(null)
      const [links, campaigns] = await Promise.all([
        supabase.from('social_links').select('*').eq('user_id', profile.id).order('position'),
        supabase
          .from('campaigns')
          .select('id, user_id, brand, title_en, title_es, description_en, description_es, via, status, is_public, position, campaign_videos(id, network, url, position)')
          .eq('user_id', profile.id)
          .eq('is_public', true)
          .order('position'),
      ])
      if (active) setData({ profile: profile as P, links: (links.data ?? []) as SocialLink[], campaigns: (campaigns.data ?? []) as Campaign[] })
    })()
    return () => {
      active = false
    }
  }, [username])

  const p = data?.profile
  const bio = p ? (lang === 'es' ? p.bio_es || p.bio_en : p.bio_en || p.bio_es) : ''
  const headline = p ? (lang === 'es' ? p.headline_es || p.headline_en : p.headline_en || p.headline_es) : ''
  useMeta(p ? `${p.display_name} (@${p.username})` : '', { description: bio || undefined })

  if (data === null) return <NotFound profile />
  if (!data || !p) return <PublicLayout><Spinner label="Loading…" /></PublicLayout>

  const avatar = avatarUrl(p.avatar_path)
  return (
    <PublicLayout>
      <article className="mx-auto max-w-2xl px-4 pt-10">
        <header className="flex flex-col items-center text-center">
          {avatar ? (
            <img src={avatar} alt={p.display_name} className="size-28 rounded-full border-2 border-accent object-cover" />
          ) : (
            <div className="grid size-28 place-items-center rounded-full border-2 border-accent bg-surface-2 text-4xl font-bold" aria-hidden>
              {p.display_name.slice(0, 1)}
            </div>
          )}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{p.display_name}</h1>
          <p className="text-muted">@{p.username}</p>
          {(headline || p.city) && (
            <p className="mt-2 font-medium">
              {headline}
              {headline && p.city && ' · '}
              {p.city && <span className="text-muted">{p.city}</span>}
            </p>
          )}
          {bio && <p className="mt-4 max-w-xl text-muted">{bio}</p>}
        </header>

        {data.links.length > 0 && (
          <nav aria-label="Social" className="mt-8 flex flex-col gap-3">
            {data.links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer me"
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 font-medium hover:border-accent"
              >
                <SocialIcon network={l.network} />
                <span className="flex-1">{l.label || NETWORK_LABEL[l.network]}</span>
                <span className="text-sm text-muted" aria-hidden>↗</span>
              </a>
            ))}
          </nav>
        )}

        {(p.niches.length > 0 || p.services.length > 0) && (
          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            {p.niches.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t('niches')}</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.niches.map((n) => <li key={n} className="rounded-full bg-surface-2 px-3 py-1 text-sm">{n}</li>)}
                </ul>
              </div>
            )}
            {p.services.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{t('services')}</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {p.services.map((s) => <li key={s} className="rounded-full border border-line px-3 py-1 text-sm">{serviceLabel(t, s)}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="mt-12" aria-labelledby="campaigns-h">
          <h2 id="campaigns-h" className="text-xl font-bold">{t('campaigns')}</h2>
          {data.campaigns.length === 0 && <p className="mt-3 text-muted">{t('no_campaigns')}</p>}
          <ul className="mt-4 grid gap-4">
            {data.campaigns.map((c) => {
              const title = lang === 'es' ? c.title_es || c.title_en : c.title_en
              const desc = lang === 'es' ? c.description_es || c.description_en : c.description_en || c.description_es
              const videos = [...(c.campaign_videos ?? [])].sort((a, b) => a.position - b.position)
              return (
                <li key={c.id} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-accent">{c.brand}</p>
                      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[c.status]}`}>
                      {t(`status_${c.status}` as DictKey)}
                    </span>
                  </div>
                  {desc && <p className="mt-2 text-sm text-muted">{desc}</p>}
                  {c.via && <p className="mt-2 text-xs text-muted">{t('via')} {c.via}</p>}
                  {videos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {videos.map((v) => (
                        <a
                          key={v.id}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-line"
                        >
                          <SocialIcon network={v.network} className="size-4" />
                          {t('watch_on')} {NETWORK_LABEL[v.network]}
                          <span className="sr-only"> ({c.brand})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {p.show_contact && p.contact_email && (
          <section className="mt-12 rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center">
            <h2 className="text-lg font-bold">{t('contact')}</h2>
            <a href={`mailto:${p.contact_email}`} className="mt-3 inline-flex rounded-xl bg-accent px-5 py-2.5 font-semibold text-accent-ink">
              {t('email_me')}
            </a>
            <p className="mt-2 text-sm text-muted">{p.contact_email}</p>
          </section>
        )}
      </article>
    </PublicLayout>
  )
}
