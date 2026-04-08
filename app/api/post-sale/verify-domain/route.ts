import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { businessId, domain }: { businessId: string; domain: string } = await req.json();

  const supabase = createClient();

  const { count, error } = await supabase
    .from('custom_domains')
    .update({ verified: true })
    .eq('business_id', businessId)
    .eq('domain', domain)
    .select('id', { count: 'exact', head: true });

  if (error || !count) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
