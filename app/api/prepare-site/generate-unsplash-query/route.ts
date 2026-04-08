import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { leadId: string };
  try {
    body = (await req.json()) as { leadId: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leadId } = body;
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Generate a concise Unsplash search query (3-5 words) to find high-quality stock photos for a local business website.

Business name: ${lead.name ?? 'unknown'}
Business category: ${lead.category ?? 'local business'}

Return ONLY the search query string — no explanation, no quotes, no punctuation other than spaces between words.`;

  let query: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = message.content[0];
    query = block.type === 'text' ? block.text.trim() : '';
    if (!query) throw new Error('Empty response from Claude');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ query });
}
