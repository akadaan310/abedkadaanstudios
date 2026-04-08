import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadToSupabase } from '@/lib/upload-to-supabase';

const HERO_PROMPT = (category: string, cityState: string) =>
  `Dramatic, wide-angle hero banner photograph for a ${category} business. Cinematic landscape composition, aspirational and high-impact. Showcases the craft or environment — a polished workspace, finished work, or signature tool of the trade. No people, no humans, no faces, no hands visible. Crisp and professional, suitable as a full-width website hero image. Location context: ${cityState}.`;

const GALLERY_PROMPT = (category: string, cityState: string) =>
  `Professional stock photography: ${category} service work in progress. Clean workspace, professional tools, quality craftsmanship. No people, no humans, no faces, no hands visible. High resolution, well lit, magazine quality. Location context: ${cityState}.`;

export async function generateAIImages(
  category: string,
  cityState: string,
  count: number,
  provider: 'gemini' | 'claude',
  slug: string,
  supabase: SupabaseClient,
  purpose: 'hero' | 'gallery' = 'gallery'
): Promise<string[]> {
  const prompt = purpose === 'hero' ? HERO_PROMPT(category, cityState) : GALLERY_PROMPT(category, cityState);
  const urls: string[] = [];

  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    for (let i = 0; i < count; i++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: prompt,
          config: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        });

        const parts = (response.candidates?.[0]?.content?.parts ?? []) as unknown[];
        type ImagePart = { inlineData: { data: string; mimeType: string } };
        const imagePart = parts.find(
          (p): p is ImagePart =>
            typeof p === 'object' && p !== null &&
            'inlineData' in p &&
            typeof (p as ImagePart).inlineData?.data === 'string'
        );
        if (!imagePart) continue;

        const url = await uploadToSupabase(
          imagePart.inlineData.data,
          `ai-gemini-${purpose}-${i}-${Date.now()}`,
          slug,
          supabase,
          imagePart.inlineData.mimeType
        );
        urls.push(url);
      } catch (err) {
        console.error(`Gemini image ${i} failed:`, err);
      }
    }
  } else {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    for (let i = 0; i < count; i++) {
      try {
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        const imageBlock = message.content.find((block) => block.type === 'image');
        if (!imageBlock) continue;

        const b64 = (imageBlock.source as { data: string }).data;
        const url = await uploadToSupabase(b64, `ai-claude-${purpose}-${i}-${Date.now()}`, slug, supabase);
        urls.push(url);
      } catch (err) {
        console.error(`Claude image ${i} failed:`, err);
      }
    }
  }

  return urls;
}
