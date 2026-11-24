import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui'
import { NETWORK_LABEL } from '../../components/SocialIcon'
import { avatarUrl, useAuth } from '../../lib/auth'
import { prepareCover } from '../../lib/files'
import { supabase } from '../../lib/supabase'
import { VIDEO_NETWORKS, type Campaign, type CampaignStatus, type VideoNetwork } from '../../lib/types'

const STATUS_LABEL: Record<CampaignStatus, string> = { completed: 'Completada', published: 'Publicada', in_progress: 'En curso' }
type Draft = Omit<Campaign, 'id' | 'user_id' | 'position' | 'campaign_videos'> & { id?: string; videos: DraftVideo[]; origCovers: string[] }
type DraftVideo = { network: VideoNetwork; url: string; cover_path?: string | null }
const blank: Draft = { brand: '', title_en: '', title_es: '', description_en: '', description_es: '', via: '', status: 'in_progress', is_public: true, videos: [], origCovers: [] }

function guessNetwork(url: string): VideoNetwork {
  if (/tiktok\.com/i.test(url)) return 'tiktok'
  if (/instagram\.com/i.test(url)) return 'instagram'
  if (/youtu\.?be/i.test(url)) return 'youtube'
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook'
  if (/(x|twitter)\.com/i.test(url)) return 'x'
  return 'other'
}

export default function Campaigns() {
  const { profile } = useAuth()
  const [items, setItems] = useState<Campaign[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [coverBusy, setCoverBusy] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    const { data, error } = await supabase.from('campaigns').select('*, campaign_videos(*)').eq('user_id', profile.id).order('position')
    if (error) setError(error.message)
    else setItems(data as Campaign[])
  }, [profile])
  useEffect(() => {
    load()
  }, [load])

  if (!profile) return null
  if (!items) return <Spinner />

  const edit = (c: Campaign) =>
    setDraft({
      id: c.id, brand: c.brand, title_en: c.title_en, title_es: c.title_es ?? '', description_en: c.description_en ?? '', description_es: c.description_es ?? '',
      via: c.via ?? '', status: c.status, is_public: c.is_public,
      videos: [...(c.campaign_videos ?? [])].sort((a, b) => a.position - b.position).map((v) => ({ network: v.network, url: v.url, cover_path: v.cover_path ?? null })),
      origCovers: coversOf(c),
    })

  const coversOf = (c: Campaign) => (c.campaign_videos ?? []).map((v) => v.cover_path).filter((p): p is string => Boolean(p))
  const draftCovers = (d: Draft) => d.videos.map((v) => v.cover_path).filter((p): p is string => Boolean(p))
  const removeCovers = async (paths: string[]) => {
    if (paths.length) await supabase.storage.from('avatars').remove(paths)
  }
  const setVideo = (i: number, patch: Partial<DraftVideo>) =>
    setDraft((d) => (d ? { ...d, videos: d.videos.map((x, j) => (j === i ? { ...x, ...patch } : x)) } : d))

  async function uploadCover(i: number, file: File | undefined) {
    if (!file || !draft) return
    setError(null)
    setCoverBusy(i)
    try {
      const img = await prepareCover(file)
      const path = `${profile!.id}/covers/${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, img, { contentType: 'image/jpeg' })
      if (error) throw error
      const prev = draft.videos[i]?.cover_path
      // Una portada recién subida que se reemplaza antes de guardar se borra ya.
      if (prev && !draft.origCovers.includes(prev)) await removeCovers([prev])
      setVideo(i, { cover_path: path })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCoverBusy(null)
    }
  }

  async function cancel() {
    if (draft) await removeCovers(draftCovers(draft).filter((p) => !draft.origCovers.includes(p)))
    setDraft(null)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!draft) return
    if (draft.videos.some((v) => !/^https:\/\//i.test(v.url.trim()))) return setError('Los links de video deben empezar por https://')
    setBusy(true)
    setError(null)
    const row = {
      user_id: profile!.id, brand: draft.brand.trim(), title_en: draft.title_en.trim(), title_es: draft.title_es?.trim() || null,
      description_en: draft.description_en?.trim() || null, description_es: draft.description_es?.trim() || null,
      via: draft.via?.trim() || null, status: draft.status, is_public: draft.is_public,
    }
    try {
      let id = draft.id
      if (id) {
        const { error } = await supabase.from('campaigns').update(row).eq('id', id)
        if (error) throw error
        await supabase.from('campaign_videos').delete().eq('campaign_id', id)
      } else {
        const { data, error } = await supabase.from('campaigns').insert({ ...row, position: items!.length }).select('id').single()
        if (error) throw error
        id = data.id as string
      }
      if (draft.videos.length) {
        const { error } = await supabase.from('campaign_videos').insert(draft.videos.map((v, i) => ({ campaign_id: id, user_id: profile!.id, network: v.network, url: v.url.trim(), position: i, ...(v.cover_path ? { cover_path: v.cover_path } : {}) })))
        if (error) throw error
      }
      const kept = draftCovers(draft)
      await removeCovers(draft.origCovers.filter((p) => !kept.includes(p)))
      setDraft(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: Campaign) {
    if (!confirm(`¿Borrar la campaña "${c.title_en}" de tu perfil público?`)) return
    const { error } = await supabase.from('campaigns').delete().eq('id', c.id)
    if (!error) await removeCovers(coversOf(c))
    load()
  }

  async function move(i: number, d: -1 | 1) {
    const j = i + d
    if (!items || j < 0 || j >= items.length) return
    const a = items[i], b = items[j]
    await Promise.all([
      supabase.from('campaigns').update({ position: j }).eq('id', a.id),
      supabase.from('campaigns').update({ position: i }).eq('id', b.id),
    ])
    load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Campañas públicas</h1>
          <p className="text-sm text-muted">Lo que las marcas ven en tu perfil. Solo marca, título, estado y videos; nunca montos.</p>
        </div>
        {!draft && <Button onClick={() => setDraft({ ...blank })}>+ Nueva campaña</Button>}
      </div>
      {error && <Alert kind="error">{error}</Alert>}

      {draft && (
        <form onSubmit={onSave}>
          <Card className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">{draft.id ? 'Editar campaña' : 'Nueva campaña'}</h2>
            <Input label="Marca" required maxLength={80} value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
            <Input label="Vía (plataforma)" maxLength={60} placeholder="StackInfluence, SideShift…" value={draft.via ?? ''} onChange={(e) => setDraft({ ...draft, via: e.target.value })} />
            <Input label="Título (inglés)" required maxLength={120} value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
            <Input label="Título (español)" maxLength={120} value={draft.title_es ?? ''} onChange={(e) => setDraft({ ...draft, title_es: e.target.value })} />
            <Textarea label="Descripción (inglés)" maxLength={400} rows={2} value={draft.description_en ?? ''} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} />
            <Textarea label="Descripción (español)" maxLength={400} rows={2} value={draft.description_es ?? ''} onChange={(e) => setDraft({ ...draft, description_es: e.target.value })} />
            <Select label="Estado" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as CampaignStatus })}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input type="checkbox" checked={draft.is_public} onChange={(e) => setDraft({ ...draft, is_public: e.target.checked })} /> Visible en mi perfil
            </label>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-medium">Videos</legend>
              {draft.videos.map((v, i) => {
                const cover = avatarUrl(v.cover_path)
                return (
                <div key={i} className="space-y-2 rounded-xl border border-line p-2">
                  <div className="flex gap-2">
                    <label className="sr-only" htmlFor={`vnet-${i}`}>Red</label>
                    <select id={`vnet-${i}`} value={v.network} onChange={(e) => setVideo(i, { network: e.target.value as VideoNetwork })} className="rounded-xl border border-line bg-bg px-2">
                      {VIDEO_NETWORKS.map((n) => <option key={n} value={n}>{NETWORK_LABEL[n]}</option>)}
                    </select>
                    <label className="sr-only" htmlFor={`vurl-${i}`}>URL del video</label>
                    <input id={`vurl-${i}`} type="url" required placeholder="https://" value={v.url}
                      onChange={(e) => setVideo(i, { url: e.target.value, network: v.url ? v.network : guessNetwork(e.target.value) })}
                      onBlur={(e) => v.network === 'other' && setVideo(i, { network: guessNetwork(e.target.value) })}
                      className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2" />
                    <button type="button" aria-label="Quitar video" className="px-2 text-bad" onClick={() => setDraft({ ...draft, videos: draft.videos.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                  <div className="flex items-center gap-3">
                    {cover
                      ? <img src={cover} alt="" className="h-16 w-9 shrink-0 rounded-md object-cover" />
                      : <div className="grid h-16 w-9 shrink-0 place-items-center rounded-md bg-surface-2 text-[10px] text-muted" aria-hidden>9:16</div>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <label className="cursor-pointer text-accent underline">
                        {coverBusy === i ? 'Subiendo…' : cover ? 'Cambiar portada' : 'Subir portada'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={coverBusy !== null}
                          onChange={(e) => { uploadCover(i, e.target.files?.[0]); e.target.value = '' }} />
                      </label>
                      {cover && <button type="button" className="text-muted underline" onClick={() => { if (!draft.origCovers.includes(v.cover_path!)) removeCovers([v.cover_path!]); setVideo(i, { cover_path: null }) }}>Quitar portada</button>}
                      <span className="w-full text-xs text-muted">
                        {v.network === 'youtube' ? 'Opcional: si no subes una, se usa la miniatura de YouTube.' : 'Una captura del video (vertical) se ve mejor en el carrusel.'}
                      </span>
                    </div>
                  </div>
                </div>
                )
              })}
              <button type="button" className="text-sm text-accent underline" onClick={() => setDraft({ ...draft, videos: [...draft.videos, { network: 'other', url: '' }] })}>+ Agregar video</button>
            </fieldset>
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
              <Button type="button" variant="ghost" onClick={cancel}>Cancelar</Button>
            </div>
          </Card>
        </form>
      )}

      <ul className="space-y-3">
        {items.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.brand}</p>
              <p className="font-medium">{c.title_es || c.title_en}</p>
              <p className="text-xs text-muted">{STATUS_LABEL[c.status]} · {c.campaign_videos?.length ?? 0} video(s){c.is_public ? '' : ' · Oculta'}</p>
            </div>
            <div className="flex gap-1">
              <button aria-label="Subir" className="rounded-lg border border-line px-2 py-1" onClick={() => move(i, -1)}>↑</button>
              <button aria-label="Bajar" className="rounded-lg border border-line px-2 py-1" onClick={() => move(i, 1)}>↓</button>
              <button className="rounded-lg border border-line px-3 py-1 text-sm" onClick={() => edit(c)}>Editar</button>
              <button className="rounded-lg px-3 py-1 text-sm text-bad" onClick={() => remove(c)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
