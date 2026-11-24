// Íconos SVG propios (simplificados) para no cargar fuentes ni scripts de terceros.
const paths: Record<string, string> = {
  tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z',
  instagram: 'M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm6-7.9a1.1 1.1 0 1 1-1.1-1.1A1.1 1.1 0 0 1 18 7.1ZM21 8.1a5.4 5.4 0 0 0-1.5-3.8A5.4 5.4 0 0 0 15.9 3C14.4 2.9 9.6 2.9 8.1 3a5.4 5.4 0 0 0-3.8 1.5A5.4 5.4 0 0 0 3 8.1c-.1 1.5-.1 6.3 0 7.8a5.4 5.4 0 0 0 1.5 3.8A5.4 5.4 0 0 0 8.1 21c1.5.1 6.3.1 7.8 0a5.4 5.4 0 0 0 3.8-1.5 5.4 5.4 0 0 0 1.3-3.6c.1-1.5.1-6.3 0-7.8Zm-2 9.4a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3 3 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3a3 3 0 0 1 1.7-1.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z',
  youtube: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z',
  facebook: 'M14 13.5h2.5l1-4H14v-2c0-1 0-2 2-2h1.5V2.1A21 21 0 0 0 14.6 2C12 2 10 3.7 10 6.7v2.8H7v4h3V22h4Z',
  x: 'M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8Zm-1.1 16.2h1.7L7.4 4.7H5.6Z',
  linkedin: 'M6.9 21H3.2V9h3.7ZM5 7.4a2.2 2.2 0 1 1 2.2-2.2A2.2 2.2 0 0 1 5 7.4ZM21 21h-3.7v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21H9.4V9h3.5v1.6a3.9 3.9 0 0 1 3.5-1.9c3.7 0 4.4 2.5 4.4 5.6Z',
}
const link = 'M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0Zm-2.8 5.7a4 4 0 0 1-2.9-6.8l2.1-2.1a1 1 0 1 1 1.4 1.4l-2.1 2.1a2 2 0 0 0 2.9 2.9l2.1-2.1a1 1 0 0 1 1.4 1.4l-2.1 2.1a4 4 0 0 1-2.8 1.1Zm8.5-6.4a1 1 0 0 1-.7-1.7l2.1-2.1a2 2 0 0 0-2.9-2.9l-2.1 2.1a1 1 0 0 1-1.4-1.4l2.1-2.1a4 4 0 0 1 5.7 5.7l-2.1 2.1a1 1 0 0 1-.7.3Z'

export const NETWORK_LABEL: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', facebook: 'Facebook', x: 'X', linkedin: 'LinkedIn',
  twitch: 'Twitch', pinterest: 'Pinterest', threads: 'Threads', snapchat: 'Snapchat', website: 'Web', other: 'Link',
}

export function SocialIcon({ network, className = 'size-5' }: { network: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={paths[network] ?? link} />
    </svg>
  )
}
