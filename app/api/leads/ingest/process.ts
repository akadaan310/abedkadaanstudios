import { createClient } from '@/lib/supabase/server';
import type { ApifyPlace } from '@/types/lead';
import type { ScoreLabel } from '@/types/dashboard';

function normalizeHours(raw: ApifyPlace['openingHours']): Record<string, string> | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  const record: Record<string, string> = {};
  for (const item of raw) {
    if (item?.day) record[item.day] = item.hours ?? '';
  }
  return Object.keys(record).length ? record : null;
}

export function computeScoreLabel(reviewCount: number): ScoreLabel {
  if (reviewCount >= 21) return 'hot';
  if (reviewCount >= 6) return 'warm';
  return 'cold';
}

interface IngestResult {
  inserted: number;
  skipped: number;
  total: number;
}

export async function ingestPlaces(
  places: ApifyPlace[],
  category: string,
  location: string
): Promise<IngestResult> {
  const supabase = createClient();
  let inserted = 0;
  let skipped = 0;

  for (const place of places) {
    // Dedup check: skip if same google_place_id OR same phone number
    const phone = place.phone?.trim();
    const orFilter = phone
      ? `google_place_id.eq.${place.placeId},phone.eq.${phone}`
      : `google_place_id.eq.${place.placeId}`;

    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .or(orFilter)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const scoreLabel = computeScoreLabel(place.reviewsCount);

    const { error } = await supabase.from('leads').insert({
      google_place_id: place.placeId,
      google_maps_url: place.url ?? null,
      name: place.title ?? null,
      address: place.street
        ? {
            street: place.street,
            city: place.city ?? '',
            state: place.state ?? '',
            zip: place.postalCode ?? '',
          }
        : null,
      phone: place.phone ?? null,
      category,
      location_query: location,
      rating: place.totalScore ?? null,
      review_count: place.reviewsCount ?? 0,
      image_count: place.images?.length ?? place.imageUrls?.length ?? place.imageCount ?? 0,
      hours: normalizeHours(place.openingHours),
      reviews_raw: null,
      score_label: scoreLabel,
      status: 'new',
    });

    if (error) {
      console.error(`Failed to insert lead for ${place.title}:`, error.message);
      continue;
    }

    inserted++;
  }

  return { inserted, skipped, total: places.length };
}
