import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import type { BusinessCopy } from '@/types/business';
import type { Review } from '@/types/lead';

type Provider = 'anthropic' | 'gemini';

function buildPrompt(
  businessName: string,
  category: string,
  city: string,
  state: string,
  reviews: Review[]
): string {
  const reviewBlock = reviews.length
    ? reviews
        .map((r) => `- ${r.reviewer} (${r.stars}★): "${r.text}"`)
        .join('\n')
    : 'No reviews available.';

  return `You are a professional copywriter creating website content for a local service business.

Business: ${businessName}
Category: ${category}
Location: ${city}, ${state}
Customer reviews:
${reviewBlock}

Write website copy for this business. Return ONLY a valid JSON object with no markdown, no code fences, no explanation. The JSON must have exactly these fields:
{
  "hero_headline": "short punchy headline (max 8 words)",
  "hero_subheadline": "one sentence value proposition",
  "about_text": "2-3 sentences about the business, warm and trustworthy tone",
  "services": [
    { "name": "Service Name", "icon": "🔧", "description": "One sentence about this service." }
  ],
  "cta_tagline": "short call to action phrase",
  "seo_title": "SEO page title including business name and city",
  "seo_description": "meta description 140-160 chars",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hero_image_prompt": "A detailed AI image generation prompt for a dramatic full-width hero photo that fits this specific business. Must be landscape orientation, no people, no text, no logos. Describe the scene, lighting, mood, and environment specific to ${category}.",
  "gallery_image_prompt": "A detailed AI image generation prompt for professional service/work photos that fit this specific business. Must be varied scenes showing the craft, tools, workspace, or finished work. No people, no text, no logos. Specific to ${category}."
}`;
}

async function generateWithAnthropic(prompt: string): Promise<BusinessCopy> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = (message.content[0] as { type: string; text: string }).text;
  try {
    return JSON.parse(raw) as BusinessCopy;
  } catch {
    console.error('Anthropic raw response:', raw);
    throw new Error('Failed to parse copy JSON from Anthropic response');
  }
}

async function generateWithGemini(prompt: string): Promise<BusinessCopy> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  const raw = response.text ?? '';
  // Strip markdown fences if Gemini wraps the response
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as BusinessCopy;
  } catch {
    console.error('Gemini raw response:', raw);
    throw new Error('Failed to parse copy JSON from Gemini response');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { leadId: string; provider: Provider };
  try {
    body = (await req.json()) as { leadId: string; provider: Provider };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { leadId, provider } = body;
  if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  if (provider !== 'anthropic' && provider !== 'gemini') {
    return NextResponse.json({ error: 'provider must be anthropic or gemini' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('name, category, address, reviews_raw')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const name = (lead.name as string | null) ?? 'This Business';
  const category = (lead.category as string | null) ?? 'Local Business';
  const address = lead.address as { city: string; state: string } | null;
  const city = address?.city ?? '';
  const state = address?.state ?? '';
  const reviews = (lead.reviews_raw as Review[] | null) ?? [];

  const prompt = buildPrompt(name, category, city, state, reviews);

  let copy: BusinessCopy;
  try {
    copy = provider === 'anthropic'
      ? await generateWithAnthropic(prompt)
      : await generateWithGemini(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Copy generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ copy });
}
