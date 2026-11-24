import { describe, expect, it } from 'vitest'
import { toEmbed } from './embeds'

describe('toEmbed', () => {
  it('reconoce los videos reales de Julian', () => {
    expect(toEmbed('https://www.tiktok.com/@julian.guerrero.oficial/video/7704866148243754270')?.src).toBe(
      'https://www.tiktok.com/player/v1/7704866148243754270?description=0&rel=0',
    )
    expect(toEmbed('https://www.instagram.com/reel/DgGtRPniWWf/')?.src).toBe('https://www.instagram.com/reel/DgGtRPniWWf/embed')
    expect(toEmbed('https://www.youtube.com/shorts/0B9iEqINyCs')).toEqual({
      network: 'youtube', src: 'https://www.youtube-nocookie.com/embed/0B9iEqINyCs?rel=0&playsinline=1', vertical: true, thumb: 'https://i.ytimg.com/vi/0B9iEqINyCs/hqdefault.jpg',
    })
  })
  it('acepta otros formatos de YouTube', () => {
    expect(toEmbed('https://youtu.be/dQw4w9WgXcQ')?.vertical).toBe(false)
    expect(toEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src).toContain('/embed/dQw4w9WgXcQ')
  })
  it('ignora links que no son videos', () => {
    expect(toEmbed('https://www.tiktok.com/@julian.guerrero.oficial')).toBeNull()
    expect(toEmbed('https://example.com/video/123456789')).toBeNull()
    expect(toEmbed('javascript:alert(1)')).toBeNull()
    expect(toEmbed('no es url')).toBeNull()
  })
})

describe('miniaturas', () => {
  it('YouTube trae su miniatura; TikTok e Instagram no', () => {
    expect(toEmbed('https://youtu.be/dQw4w9WgXcQ')?.thumb).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(toEmbed('https://www.tiktok.com/@a/video/7704866148243754270')?.thumb).toBeUndefined()
    expect(toEmbed('https://www.instagram.com/reel/ABCdef123/')?.thumb).toBeUndefined()
  })
})
