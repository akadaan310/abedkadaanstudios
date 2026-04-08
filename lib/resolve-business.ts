import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Business } from '@/types/business';

export async function resolveBusinessFromRequest(): Promise<Business | null> {
  const headersList = await headers();
  const slug = headersList.get('x-business-slug');
  const customDomain = headersList.get('x-custom-domain');

  const supabase = createClient();

  if (slug) {
    const { data } = await supabase
      .from('businesses')
      .select('*, lead:leads(rating, review_count)')
      .eq('slug', slug)
      .single();

    return (data as Business | null) ?? null;
  }

  if (customDomain) {
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('business_id')
      .eq('domain', customDomain)
      .eq('verified', true)
      .single();

    if (!domainRow) return null;

    const { data } = await supabase
      .from('businesses')
      .select('*, lead:leads(rating, review_count)')
      .eq('id', domainRow.business_id)
      .single();

    return (data as Business | null) ?? null;
  }

  return null;
}
