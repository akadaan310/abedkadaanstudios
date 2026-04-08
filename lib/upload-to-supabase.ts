import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload an image to Supabase Storage under business-photos/{slug}/.
 * `source` may be an http(s) URL or a raw base64 string.
 * Returns the public CDN URL of the uploaded file.
 */
export async function uploadToSupabase(
  source: string,
  filename: string,
  slug: string,
  supabase: SupabaseClient,
  mimeType?: string
): Promise<string> {
  let buffer: Buffer;
  let contentType: string;

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${source}`);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    contentType = res.headers.get('content-type') ?? 'image/jpeg';
  } else if (source.startsWith('data:')) {
    const matches = source.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL format');
    contentType = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // Raw base64
    contentType = mimeType ?? 'image/jpeg';
    buffer = Buffer.from(source, 'base64');
  }

  const ext = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') ?? 'jpg';
  const storagePath = `${slug}/${filename}.${ext}`;

  const { error } = await supabase.storage
    .from('business-photos')
    .upload(storagePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('business-photos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
