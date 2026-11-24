import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/i18n'
import type { Embed } from '../lib/embeds'
import { VideoEmbed } from './VideoEmbed'

export type CarouselVideo = { id: string; url: string; brand: string; embed: Embed }

/**
 * Carrusel centrado: el video activo queda al centro y los vecinos asoman a
 * los lados, más pequeños y atenuados. Funciona con deslizar (scroll-snap),
 * flechas, puntos y teclado (← →).
 */
export function VideoCarousel({ videos }: { videos: CarouselVideo[] }) {
  const { t } = useLang()
  const track = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)

  const onScroll = useCallback(() => {
    const el = track.current
    if (!el) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let dist = Infinity
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid)
      if (d < dist) { dist = d; best = i }
    })
    setCurrent(best)
  }, [])

  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const handler = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(onScroll) }
    el.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [onScroll])

  const goTo = (i: number) => {
    const el = track.current
    const target = el?.children[Math.max(0, Math.min(videos.length - 1, i))] as HTMLElement | undefined
    if (!el || !target) return
    el.scrollTo({ left: target.offsetLeft + target.offsetWidth / 2 - el.clientWidth / 2, behavior: 'smooth' })
  }

  const arrow = 'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/80 text-ink shadow-lg backdrop-blur transition hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-0 sm:grid'

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('featured_videos')}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1) }
      }}
    >
      <ul
        ref={track}
        className="flex snap-x snap-mandatory items-center overflow-x-auto px-[calc(50%-var(--slide)/2)] py-4 [--slide:min(62vw,260px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v, i) => (
          <li
            key={v.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${videos.length}`}
            aria-current={i === current}
            className={`w-(--slide) shrink-0 snap-center px-1.5 transition duration-300 ease-out ${
              i === current ? 'scale-100 opacity-100' : 'scale-[0.86] opacity-45'
            }`}
            onClick={() => i !== current && goTo(i)}
          >
            <div className={i === current ? '' : 'pointer-events-none'}>
              <VideoEmbed embed={v.embed} title={v.brand} href={v.url} />
            </div>
          </li>
        ))}
      </ul>

      {videos.length > 1 && (
        <>
          <button type="button" className={`${arrow} left-0`} onClick={() => goTo(current - 1)} disabled={current === 0} aria-label={t('prev_video')}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" className={`${arrow} right-0`} onClick={() => goTo(current + 1)} disabled={current === videos.length - 1} aria-label={t('next_video')}>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <div className="mt-1 flex justify-center gap-2">
            {videos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${t('go_to_video')} ${i + 1}: ${v.brand}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-accent' : 'w-2 bg-line hover:bg-muted'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
