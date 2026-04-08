import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data } = await supabase
    .from('businesses')
    .select('slug, created_at');

  return (data ?? []).map(({ slug, created_at }: { slug: string; created_at: string }) => ({
    url: `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}`,
    lastModified: new Date(created_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));
}
