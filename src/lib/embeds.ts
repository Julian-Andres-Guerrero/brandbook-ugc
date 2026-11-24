// Convierte el link de un video en una URL de reproductor embebido.
// Solo TikTok, Instagram y YouTube; cualquier otro link se muestra como botón.
// `thumb` solo existe para YouTube (i.ytimg.com no usa cookies); TikTok e
// Instagram no ofrecen una miniatura pública estable, por eso el creador sube
// su propia portada desde el panel.
export type Embed = { network: 'tiktok' | 'instagram' | 'youtube'; src: string; vertical: boolean; thumb?: string }

export function toEmbed(url: string): Embed | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\.|^m\./, '')
  if (host === 'tiktok.com') {
    const id = u.pathname.match(/\/video\/(\d{6,25})/)?.[1]
    return id ? { network: 'tiktok', src: `https://www.tiktok.com/player/v1/${id}?description=0&rel=0`, vertical: true } : null
  }
  if (host === 'instagram.com') {
    const m = u.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})/)
    if (!m) return null
    const kind = m[1] === 'reels' ? 'reel' : m[1]
    return { network: 'instagram', src: `https://www.instagram.com/${kind}/${m[2]}/embed`, vertical: true }
  }
  if (host === 'youtube.com' || host === 'youtu.be') {
    const id =
      host === 'youtu.be'
        ? u.pathname.slice(1)
        : (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,20})/)?.[1] ?? u.searchParams.get('v'))
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null
    // youtube-nocookie: YouTube no guarda cookies hasta que se reproduce.
    return {
      network: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      vertical: u.pathname.startsWith('/shorts/'),
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    }
  }
  return null
}
