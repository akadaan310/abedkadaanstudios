import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateColorSystem } from '@/app/api/prepare-site/generate-colors';
import { generateSlug } from '@/lib/generate-slug';
import { uploadToSupabase } from '@/lib/upload-to-supabase';
import type { BusinessCopy, ColorSystem } from '@/types/business';

interface RequestBody {
  leadId: string;
  copy: BusinessCopy;
  colorSystem: ColorSystem | null;
  photoHero: string;
  photosGallery: string[];
  photosAiGenerated: boolean;
}

async function resolveUniqueSlug(base: string, supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase
    .from('businesses')
    .select('slug')
    .like('slug', `${base}%`);

  const existing = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!existing.has(base)) return base;

  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { leadId, copy, photosAiGenerated, photoHero, photosGallery } = body;
  let { colorSystem } = body;

  const supabase = createClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (!colorSystem) {
    colorSystem = await generateColorSystem(
      lead.category ?? 'local service',
      lead.name ?? 'Local Business'
    );
  }

  const baseSlug = generateSlug(lead.name ?? leadId);
  const slug = await resolveUniqueSlug(baseSlug, supabase);

  const uploadedHero = await uploadToSupabase(photoHero, 'hero', slug, supabase);

  const uploadedGallery = await Promise.all(
    photosGallery.map((url, i) => uploadToSupabase(url, `gallery-${i}`, slug, supabase))
  );

  const { data: business, error: insertError } = await supabase
    .from('businesses')
    .insert({
      lead_id: leadId,
      name: lead.name,
      slug,
      category: lead.category,
      phone: lead.phone,
      address: lead.address,
      hours: lead.hours,
      hero_headline: copy.hero_headline,
      hero_subheadline: copy.hero_subheadline,
      about_text: copy.about_text,
      services: copy.services,
      cta_tagline: copy.cta_tagline,
      seo_title: copy.seo_title,
      seo_description: copy.seo_description,
      seo_keywords: copy.seo_keywords,
      reviews: lead.reviews_raw ?? [],
      photo_hero: uploadedHero,
      photos_gallery: uploadedGallery,
      photos_ai_generated: photosAiGenerated,
      color_system: colorSystem,
    })
    .select('id')
    .single();

  if (insertError || !business) {
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }

  await supabase
    .from('leads')
    .update({ status: 'emailed', prepared_at: new Date().toISOString() })
    .eq('id', leadId);

  const isDev = process.env.NODE_ENV === "development";
  const siteUrl = isDev
    ? `http://localhost:3000/${slug}`
    : `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}`;

  return NextResponse.json({
    ok: true,
    siteUrl,
    slug,
    businessId: business.id,
  });
}
