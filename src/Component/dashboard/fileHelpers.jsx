export const FILES_HOST = 'http://localhost:3000';

export const isWordDoc = name => /\.docx?$/i.test(String(name ?? ''));

export function normalizeFiles(raw) {
  if (!raw || (Array.isArray(raw) && !raw.length)) return [];
  return (Array.isArray(raw) ? raw : [raw])
    .map(f => {
      if (typeof f === 'string') {
        const url = f.startsWith('http') ? f : `${FILES_HOST}${f.startsWith('/') ? '' : '/'}${f}`;
        return { url, name: f.split('/').pop(), mime: '' };
      }
      const filePath = f.file_path ?? f.url ?? f.path ?? f.file_url ?? '';
      const name     = f.file_name ?? f.filename ?? f.name ?? f.original_name ?? filePath.split('/').pop() ?? 'file';
      const mime     = f.mime_type ?? f.mime ?? '';
      const url      = filePath.startsWith('http')
        ? filePath
        : `${FILES_HOST}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      return { url, name, mime };
    })
    .filter(f => f.url);
}

export function fileKind(file) {
  if (typeof file === 'string') {
    const ext = (file.split('?')[0].split('.').pop() ?? '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext))                 return 'video';
    return 'document';
  }
  const mime = (file.mime ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime) return 'document';
  const ext = (file.url.split('?')[0].split('.').pop() ?? '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext))                 return 'video';
  return 'document';
}
