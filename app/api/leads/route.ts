import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(): Promise<NextResponse> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*, businesses(slug)')
    .order('discovered_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
