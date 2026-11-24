import { useEffect } from 'react'
import { SITE_NAME } from '../config'

/** Título de la pestaña y meta robots por página. El panel siempre va con noindex. */
export function useMeta(title: string, opts: { noindex?: boolean; description?: string } = {}) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (opts.noindex) {
      if (!robots) {
        robots = document.createElement('meta')
        robots.name = 'robots'
        document.head.appendChild(robots)
      }
      robots.content = 'noindex, nofollow'
    } else robots?.remove()
    if (opts.description) document.querySelector('meta[name="description"]')?.setAttribute('content', opts.description)
  }, [title, opts.noindex, opts.description])
}
