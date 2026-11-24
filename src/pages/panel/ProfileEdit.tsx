import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, Input, Select, Textarea } from '../../components/ui'
import { NETWORK_LABEL } from '../../components/SocialIcon'
import { AVATAR_MAX_BYTES, AVATAR_MIME, SITE_URL } from '../../config'
import { avatarUrl, useAuth } from '../../lib/auth'
import { formatBytes } from '../../lib/files'
import { SERVICE_KEYS, serviceLabel, useLang } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { NETWORKS, type Network, type SocialLink } from '../../lib/types'

type LinkDraft = { id?: string; network: Network; label: string; url: string }

export default function ProfileEdit() {
  const { profile, refreshProfile, session } = useAuth()
  const { t } = useLang()
  const [f, setF] = useState(() => ({
    display_name: profile?.display_name ?? '', headline_en: profile?.headline_en ?? '', headline_es: profile?.headline_es ?? '',
    city: profile?.city ?? '', bio_en: profile?.bio_en ?? '', bio_es: profile?.bio_es ?? '',
    niches: (profile?.niches ?? []).join(', '), services: profile?.services ?? [], custom_services: '',
    contact_email: profile?.contact_email ?? '', show_contact: profile?.show_contact ?? false, is_public: profile?.is_public ?? true,
  }))
  const [links, setLinks] = useState<LinkDraft[]>([])
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    const known = (SERVICE_KEYS as readonly string[])
    setF((x) => ({ ...x, services: profile.services.filter((s) => known.includes(s)), custom_services: profile.services.filter((s) => !known.includes(s)).join(', ') }))
    supabase.from('social_links').select('*').eq('user_id', profile.id).order('position').then(({ data }) =>
      setLinks(((data ?? []) as SocialLink[]).map((l) => ({ id: l.id, network: l.network, label: l.label ?? '', url: l.url }))),
    )
  }, [profile])

  if (!profile || !session) return null
  const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 15)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (links.some((l) => !/^https:\/\//i.test(l.url.trim()))) return setMsg({ kind: 'error', text: 'Cada link de red social debe empezar por https://' })
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.from('profiles').update({
      display_name: f.display_name.trim(), headline_en: f.headline_en.trim() || null, headline_es: f.headline_es.trim() || null,
      city: f.city.trim() || null, bio_en: f.bio_en.trim() || null, bio_es: f.bio_es.trim() || null,
      niches: list(f.niches), services: [...f.services, ...list(f.custom_services)].slice(0, 15),
      contact_email: f.contact_email.trim() || null, show_contact: f.show_contact, is_public: f.is_public,
    }).eq('id', profile!.id)
    if (!error) {
      // Reemplazo simple de la lista de redes (pocas filas).
      await supabase.from('social_links').delete().eq('user_id', profile!.id)
      if (links.length) {
        const { error: e2 } = await supabase.from('social_links').insert(
          links.map((l, i) => ({ user_id: profile!.id, network: l.network, label: l.label.trim() || null, url: l.url.trim(), position: i })),
        )
        if (e2) setMsg({ kind: 'error', text: e2.message })
      }
    }
    setBusy(false)
    if (error) return setMsg({ kind: 'error', text: error.message })
    await refreshProfile()
    setMsg((m) => m ?? { kind: 'ok', text: 'Perfil guardado.' })
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return
    if (!(AVATAR_MIME as readonly string[]).includes(file.type)) return setMsg({ kind: 'error', text: 'La foto debe ser JPG, PNG o WebP.' })
    if (file.size > AVATAR_MAX_BYTES) return setMsg({ kind: 'error', text: `La foto pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(AVATAR_MAX_BYTES)}.` })
    const path = `${session!.user.id}/avatar-${Date.now()}.${file.type.split('/')[1]}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
    if (error) return setMsg({ kind: 'error', text: error.message })
    if (profile!.avatar_path) await supabase.storage.from('avatars').remove([profile!.avatar_path])
    await supabase.from('profiles').update({ avatar_path: path }).eq('id', profile!.id)
    await refreshProfile()
    setMsg({ kind: 'ok', text: 'Foto actualizada.' })
  }

  const avatar = avatarUrl(profile.avatar_path)
  const moveLink = (i: number, d: -1 | 1) => setLinks((ls) => {
    const c = [...ls]
    const j = i + d
    if (j < 0 || j >= c.length) return ls
    ;[c[i], c[j]] = [c[j], c[i]]
    return c
  })

  return (
    <form onSubmit={onSave} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil público</h1>
        <p className="text-sm text-muted">
          Tu URL: <a className="text-accent underline" href={`/@${profile.username}`} target="_blank" rel="noopener">{SITE_URL.replace(/^https?:\/\//, '')}/@{profile.username}</a>.
          Aquí nunca se muestran valores, pagos ni facturas.
        </p>
      </div>

      <Card className="flex flex-wrap items-center gap-4">
        {avatar ? <img src={avatar} alt="Tu foto de perfil" className="size-20 rounded-full object-cover" /> : <div className="size-20 rounded-full bg-surface-2" aria-hidden />}
        <label className="text-sm">
          <span className="mb-1 block font-medium">Foto de perfil</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onAvatar(e.target.files?.[0])} className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-ink" />
          <span className="mt-1 block text-xs text-muted">JPG, PNG o WebP, máximo {formatBytes(AVATAR_MAX_BYTES)}. La foto es pública.</span>
        </label>
      </Card>

      <Card className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" required maxLength={80} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} />
        <Input label="Ciudad" maxLength={80} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <Input label="Titular (inglés)" maxLength={120} value={f.headline_en} onChange={(e) => setF({ ...f, headline_en: e.target.value })} />
        <Input label="Titular (español)" maxLength={120} value={f.headline_es} onChange={(e) => setF({ ...f, headline_es: e.target.value })} />
        <Textarea label="Biografía (inglés)" maxLength={600} value={f.bio_en} onChange={(e) => setF({ ...f, bio_en: e.target.value })} />
        <Textarea label="Biografía (español)" maxLength={600} value={f.bio_es} onChange={(e) => setF({ ...f, bio_es: e.target.value })} />
        <div className="sm:col-span-2">
          <Input label="Nichos" value={f.niches} onChange={(e) => setF({ ...f, niches: e.target.value })} hint="Separados por coma. Ej.: Tech, Pets, Food & Drink, Home, Travel" />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium">Servicios</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICE_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm">
                <input type="checkbox" checked={f.services.includes(k)} onChange={(e) => setF({ ...f, services: e.target.checked ? [...f.services, k] : f.services.filter((s) => s !== k) })} />
                {serviceLabel(t, k)}
              </label>
            ))}
          </div>
          <div className="mt-3"><Input label="Otros servicios" value={f.custom_services} onChange={(e) => setF({ ...f, custom_services: e.target.value })} hint="Separados por coma." /></div>
        </fieldset>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Redes sociales</h2>
        {links.map((l, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[9rem_1fr_9rem_auto]">
            <Select label="Red" value={l.network} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, network: e.target.value as Network } : x)))}>
              {NETWORKS.map((n) => <option key={n} value={n}>{NETWORK_LABEL[n]}</option>)}
            </Select>
            <Input label="URL" type="url" required placeholder="https://" value={l.url} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <Input label="Texto (opcional)" maxLength={40} value={l.label} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <div className="flex items-end gap-1">
              <button type="button" aria-label="Subir" className="rounded-lg border border-line px-2 py-2" onClick={() => moveLink(i, -1)}>↑</button>
              <button type="button" aria-label="Bajar" className="rounded-lg border border-line px-2 py-2" onClick={() => moveLink(i, 1)}>↓</button>
              <button type="button" aria-label="Quitar" className="rounded-lg px-2 py-2 text-bad" onClick={() => setLinks(links.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="text-sm text-accent underline" onClick={() => setLinks([...links, { network: 'tiktok', label: '', url: '' }])}>+ Agregar red</button>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Contacto y visibilidad</h2>
        <Input label="Email de contacto público" type="email" value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} hint="Puede ser distinto al correo de tu cuenta." />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.show_contact} onChange={(e) => setF({ ...f, show_contact: e.target.checked })} /> Mostrar el email de contacto en mi perfil</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} /> Perfil público visible (si lo desactivas, /@{profile.username} deja de mostrarse)</label>
      </Card>

      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar perfil'}</Button>
    </form>
  )
}
