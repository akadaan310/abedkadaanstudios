import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIImages } from '@/app/api/prepare-site/generate-images';
import { generateSlug } from '@/lib/generate-slug';

interface RequestBody {
  leadId: string;
  provider: 'gemini' | 'claude';
  count: number;
  purpose: 'hero' | 'gallery';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leadId, provider, count, purpose } = body;
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  if (provider !== 'gemini' && provider !== 'claude') {
    return NextResponse.json({ error: 'provider must be gemini or claude' }, { status: 400 });
  }
  if (purpose !== 'hero' && purpose !== 'gallery') {
    return NextResponse.json({ error: 'purpose must be hero or gallery' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('name, category, address, businesses(slug)')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const businessRow = Array.isArray(lead.businesses) ? lead.businesses[0] : lead.businesses;
  const slug: string =
    (businessRow as { slug?: string } | null)?.slug ?? generateSlug(lead.name ?? leadId);

  const address = lead.address as { city?: string; state?: string } | null;
  const city = address?.city ?? '';
  const state = address?.state ?? '';
  const cityState = [city, state].filter(Boolean).join(', ');
  const category = (lead.category as string | null) ?? 'local service';

  let urls: string[];
  try {
    urls = await generateAIImages(category, cityState, count, provider, slug, supabase, purpose);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ urls });
}
