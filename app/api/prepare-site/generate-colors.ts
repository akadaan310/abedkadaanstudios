import Anthropic from '@anthropic-ai/sdk';
import type { ColorSystem } from '@/types/business';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateColorSystem(
  category: string,
  businessName: string
): Promise<ColorSystem> {
  const prompt = `You are a senior brand designer. Create a distinctive, memorable color system for a local ${category} business called "${businessName}".

This palette will be used across a full website. It must feel intentional and specific to this trade — not recycled from a generic template.

Return ONLY this JSON object, no markdown fences:

{
  "primary":    "#hex",
  "secondary":  "#hex",
  "accent":     "#hex",
  "background": "#hex",
  "surface":    "#hex",
  "text":       "#hex",
  "textLight":  "#hex"
}

Color role definitions:
- primary: the dominant brand color — used on nav, hero overlays, buttons. Must strongly reflect the ${category} trade's visual identity and emotional tone
- secondary: a complementary color that pairs with primary — used on section backgrounds, cards. Should be a distinctly different hue or shade, not just a tint of primary
- accent: a high-contrast pop color for CTAs, highlights, stars. Should create tension/energy against primary
- background: page background — can be off-white, warm cream, very light gray, or a pale tint of primary (not always pure white)
- surface: card/panel background — slightly different from background to create depth
- text: main body text — must be dark enough for readability but can have a warm or cool tint
- textLight: muted text for captions, metadata — noticeably lighter than text

Design direction by trade category:
- Plumbing / HVAC / mechanical: industrial blues, steels, or deep navy — clean and technical
- Landscaping / lawn care / tree service: rich greens, earthy browns, or forest tones — organic and natural
- Roofing / siding / exterior: charcoal, slate, deep teal, or brick tones — sturdy and weather-worn
- Electrical: bold yellows, black, or high-contrast dark themes — energetic and precise
- Cleaning / maid service: crisp whites with fresh teals, purples, or sky blues — clean and airy
- Painting: expressive and varied — lean into whatever feels artistic and bold
- Pest control: dark, serious tones — deep greens, charcoal, or brown
- Construction / remodeling: concrete grays, warm tans, or deep oranges — rugged and solid
- Auto / garage: dark backgrounds, metallic accents, bold reds or blacks
- Beauty / personal care: soft, luxurious tones — rose, mauve, champagne, or deep jewel tones
- Food / catering: warm appetizing tones — terracotta, saffron, deep reds
- Fitness / wellness: energetic brights or calm greens/blues
- Legal / financial / professional services: deep navy, forest green, or charcoal with gold accents
- Default (unknown trade): choose colors that feel specific and considered — avoid generic blue + white

Additional rules:
- background should be in the #f2f2f2 to #ffffff range (very light, but can have a warm/cool tint)
- text should be in the #0a0a0a to #404040 range
- textLight should be noticeably lighter than text (e.g. #666 to #999)
- surface should differ from background by at least 5-10% lightness
- Do NOT produce the same palette you would give a generic business — make it feel like it was designed specifically for ${category}
- Vary your choices: do not default to the same accent color across different businesses`;

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
