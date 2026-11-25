// Phone cameras produce 3-8 MB photos, but the server accepts at most 5 MB.
// This shrinks big photos in the browser before upload (max 1600 px on the
// long side), which also saves the uploader's mobile data. Small images, GIFs
// and anything we cannot decode are sent unchanged. PNGs stay PNG so logos
// keep their transparent background.
export async function prepareImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/gif') return file
  if (file.size < 600 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const isPng = file.type === 'image/png'
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, isPng ? 'image/png' : 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    const base = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.${isPng ? 'png' : 'jpg'}`, { type: blob.type })
  } catch {
    return file
  }
}
