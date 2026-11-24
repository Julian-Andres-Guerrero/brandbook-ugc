import { INVOICE_MAX_BYTES, INVOICE_MIME } from '../config'

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`

/** Nombre de archivo seguro para la ruta de Storage (sin tildes, espacios raros ni "../"). */
export function safeFileName(name: string) {
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'archivo'
  return ext ? `${base}.${ext}` : base
}

/**
 * Reduce una foto de factura demasiado grande (ej. foto del celular de 12 MB)
 * re-codificándola como JPEG. Los PDF no se tocan.
 */
async function shrinkImage(file: File, maxBytes: number): Promise<File> {
  const bitmap = await createImageBitmap(file)
  let scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
  for (let quality = 0.85; quality >= 0.4; quality -= 0.15) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (blob && blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
    }
    scale *= 0.8
  }
  throw new Error('No se pudo reducir la imagen por debajo del límite.')
}

export type PreparedFile = { file: File; note?: string }

/** Valida tipo y tamaño; si es una imagen grande intenta reducirla antes de subirla. */
export async function prepareInvoice(file: File): Promise<PreparedFile> {
  if (!(INVOICE_MIME as readonly string[]).includes(file.type)) {
    throw new Error('Formato no permitido. Sube un PDF o una imagen JPG, PNG o WebP.')
  }
  if (file.size <= INVOICE_MAX_BYTES) return { file }
  if (file.type === 'application/pdf') {
    throw new Error(`El PDF pesa ${formatBytes(file.size)} y el límite es ${formatBytes(INVOICE_MAX_BYTES)}. Compártelo comprimido o como imagen.`)
  }
  const small = await shrinkImage(file, INVOICE_MAX_BYTES)
  return { file: small, note: `La imagen se redujo de ${formatBytes(file.size)} a ${formatBytes(small.size)} para poder subirla.` }
}

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Portada de un video: se recorta a 1080 px de lado mayor y se guarda como JPEG
 * para que cargue rápido en el perfil público (límite del bucket: 2 MB).
 */
export async function prepareCover(file: File, maxBytes = 2 * 1024 * 1024): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Formato no permitido. Sube una imagen JPG, PNG o WebP.')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1080 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  for (let quality = 0.85; quality >= 0.4; quality -= 0.15) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (blob && blob.size <= maxBytes) return new File([blob], 'cover.jpg', { type: 'image/jpeg' })
  }
  throw new Error('No se pudo reducir la imagen por debajo de 2 MB.')
}
