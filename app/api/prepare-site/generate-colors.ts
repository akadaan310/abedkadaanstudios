import Anthropic from '@anthropic-ai/sdk';
import type { ColorSystem } from '@/types/business';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateColorSystem(
  category: string,
  businessName: string
): Promise<ColorSystem> {
  const prompt = `You are a senior brand designer creating a color system for a local ${category} business called '${businessName}'. The design will be used on a premium lead generation website for homeowners and local customers. It must feel trustworthy, professional, and modern — not generic or corporate.

Return a JSON object with exactly these 7 hex color values. Return only JSON, no markdown fences:

{
  "primary":    "#hex",
  "secondary":  "#hex",
  "accent":     "#hex",
  "background": "#hex",
  "surface":    "#hex",
  "text":       "#hex",
  "textLight":  "#hex"
}

Rules:
- primary must suit a ${category} professional — avoid defaulting to generic blue
- accent should be warm or energetic (orange, amber, gold, or green work well for service trades)
- background must be very light (#f8f8f8 to #ffffff range)
- text must be dark (#111111 to #3a3a3a range)
- Do NOT default to blue/white unless it genuinely fits ${category}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;

  let colors: ColorSystem;
  try {
    colors = JSON.parse(raw) as ColorSystem;
  } catch {
    console.error('Color parse failed. Raw Claude response:', raw);
    throw new Error('Color parse failed');
  }

  return colors;
}
