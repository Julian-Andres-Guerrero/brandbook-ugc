export type Lang = 'en' | 'es'

export type Profile = {
  id: string
  username: string
  display_name: string
  headline_en: string | null
  headline_es: string | null
  city: string | null
  bio_en: string | null
  bio_es: string | null
  avatar_path: string | null
  niches: string[]
  services: string[]
  contact_email: string | null
  show_contact: boolean
  is_public: boolean
}

export const NETWORKS = [
  'tiktok', 'instagram', 'youtube', 'facebook', 'x', 'linkedin', 'twitch', 'pinterest', 'threads', 'snapchat', 'website', 'other',
] as const
export type Network = (typeof NETWORKS)[number]

export type SocialLink = {
  id: string
  user_id: string
  network: Network
  label: string | null
  url: string
  position: number
}

export const VIDEO_NETWORKS = ['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'other'] as const
export type VideoNetwork = (typeof VIDEO_NETWORKS)[number]

export type CampaignStatus = 'completed' | 'published' | 'in_progress'
export type CampaignVideo = { id: string; campaign_id: string; user_id: string; network: VideoNetwork; url: string; position: number }
export type Campaign = {
  id: string
  user_id: string
  brand: string
  title_en: string
  title_es: string | null
  description_en: string | null
  description_es: string | null
  via: string | null
  status: CampaignStatus
  is_public: boolean
  position: number
  campaign_videos?: CampaignVideo[]
}

export const PLATFORMS = ['sideshift', 'joinbrands', 'stackinfluence', 'collabstr', 'insense', 'direct', 'other'] as const
export type Platform = (typeof PLATFORMS)[number]
export const PLATFORM_LABEL: Record<Platform, string> = {
  sideshift: 'SideShift',
  joinbrands: 'JoinBrands',
  stackinfluence: 'StackInfluence',
  collabstr: 'Collabstr',
  insense: 'Insense',
  direct: 'Marca directa',
  other: 'Otra',
}

export const RECORD_STATUSES = ['received', 'video_pending', 'published', 'paid'] as const
export type RecordStatus = (typeof RECORD_STATUSES)[number]
export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  received: 'Recibido',
  video_pending: 'Video pendiente',
  published: 'Publicado',
  paid: 'Pagado',
}

export type ProductRecord = {
  id: string
  user_id: string
  product: string
  brand: string | null
  campaign: string | null
  platform: Platform
  received_on: string // YYYY-MM-DD
  deadline_on: string | null
  product_url: string | null
  order_url: string | null
  video_url: string | null
  product_value: number | null
  cash_payment: number
  paid_on: string | null
  status: RecordStatus
  notes: string | null
  invoice_path: string | null
  invoice_name: string | null
  invoice_mime: string | null
  invoice_size: number | null
  created_at: string
  updated_at: string
}

export type AuditEntry = {
  id: number
  action: string
  table_name: string | null
  record_id: string | null
  details: { fields?: string[] } & Record<string, unknown>
  created_at: string
}
