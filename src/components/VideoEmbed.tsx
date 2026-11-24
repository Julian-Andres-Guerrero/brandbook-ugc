import { useState } from 'react'
import { useLang } from '../lib/i18n'
import type { Embed } from '../lib/embeds'
import { NETWORK_LABEL, SocialIcon } from './SocialIcon'

const tint: Record<Embed['network'], string> = {
  tiktok: 'from-[#25F4EE]/25 via-surface-2 to-[#FE2C55]/25',
  instagram: 'from-[#F58529]/25 via-[#DD2A7B]/20 to-[#8134AF]/25',
  youtube: 'from-[#FF0000]/25 via-surface-2 to-surface-2',
}

/**
 * Reproductor "clic para cargar": el iframe de TikTok/Instagram/YouTube (y sus
 * cookies) solo se carga cuando el visitante toca reproducir.
 */
export function VideoEmbed({ embed, title, href }: { embed: Embed; title: string; href: string }) {
  const { t } = useLang()
  const [active, setActive] = useState(false)
  const net = NETWORK_LABEL[embed.network]
  const ratio = embed.vertical ? 'aspect-[9/16]' : 'aspect-video'

  if (active) {
    return (
      <div className={`${ratio} w-full overflow-hidden rounded-2xl border border-line bg-black`}>
        <iframe
          src={embed.src}
          title={`${title} (${net})`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }
  return (
    <div className={`${ratio} relative w-full overflow-hidden rounded-2xl border border-line bg-gradient-to-br ${tint[embed.network]}`}>
      <button
        onClick={() => setActive(true)}
        className="group absolute inset-0 flex flex-col items-center justify-center gap-3 p-3 text-center"
        aria-label={`${t('play_here')}: ${title} (${net})`}
      >
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-lg transition group-hover:scale-110" aria-hidden>
          <svg viewBox="0 0 24 24" className="ml-1 size-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="text-sm font-semibold leading-tight">{title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted"><SocialIcon network={embed.network} className="size-3.5" />{net}</span>
      </button>
      <p className="pointer-events-none absolute inset-x-2 bottom-2 text-center text-[10px] leading-tight text-muted">{t('embed_notice').replace('{net}', net)}</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-2 rounded-full bg-bg/70 px-2 py-1 text-[11px] text-muted hover:text-ink">
        ↗<span className="sr-only"> {t('watch_on')} {net}</span>
      </a>
    </div>
  )
}
