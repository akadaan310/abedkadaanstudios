import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateColorSystem } from '@/app/api/prepare-site/generate-colors';
import type { ColorSystem } from '@/types/business';

interface RequestBody {
  leadId: string;
  provider: 'anthropic' | 'gemini';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leadId, provider } = body;
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('name, category')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const name = (lead.name as string | null) ?? 'Local Business';
  const category = (lead.category as string | null) ?? 'local service';

  let colorSystem: ColorSystem;
  try {
    colorSystem = await generateColorSystem(category, name);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Color generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ colorSystem });
}
