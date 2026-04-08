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
  purpose: 'hero' | 'gallery' = 'gallery',
  customPrompt?: string
): Promise<string[]> {
  const prompt = customPrompt?.trim()
    ? customPrompt.trim()
    : purpose === 'hero' ? HERO_PROMPT(category, cityState) : GALLERY_PROMPT(category, cityState);
  const urls: string[] = [];

  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    for (let i = 0; i < count; i++) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          responseModalities: ['IMAGE'],
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
      if (!imagePart) {
        throw new Error(`Gemini returned no image. Parts: ${JSON.stringify(parts)}`);
      }

      const url = await uploadToSupabase(
        imagePart.inlineData.data,
        `ai-gemini-${purpose}-${i}-${Date.now()}`,
        slug,
        supabase,
        imagePart.inlineData.mimeType
      );
      urls.push(url);
    }
  } else {
    throw new Error('Claude does not support image generation. Please use Google Gemini.');
  }

  return urls;
}
