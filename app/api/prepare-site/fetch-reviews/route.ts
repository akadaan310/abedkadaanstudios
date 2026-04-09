import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApifyReview, Review } from '@/types/lead';

export const maxDuration = 300;

interface ApifyRunResponse {
  data?: {
    id?: string;
    defaultDatasetId?: string;
  };
}

interface ApifyPlaceResult {
  reviews?: ApifyReview[];
}

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

  // Fetch lead to get place URL
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('google_place_id, google_maps_url')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const placeUrl =
    lead.google_maps_url ??
    `https://www.google.com/maps/search/?api=1&query_place_id=${lead.google_place_id}`;

  const APIFY_API_KEY = process.env.APIFY_API_KEY!;

  // Run Apify to fetch reviews for this specific place
  let runData: ApifyRunResponse;
  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_API_KEY}&waitForFinish=300`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: placeUrl }],
          maxCrawledPlaces: 1,
          maxReviews: 25,
          maxImages: 0,
          includeOpeningHours: false,
          language: 'en',
        }),
      }
    );
    runData = (await runRes.json()) as ApifyRunResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apify request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!runData?.data?.id) {
    return NextResponse.json({ error: 'Apify run failed to start' }, { status: 500 });
  }

  const datasetId = runData.data.defaultDatasetId;
  if (!datasetId) {
    return NextResponse.json({ error: 'Apify run returned no dataset ID' }, { status: 500 });
  }

  // Fetch dataset items
  let placeResults: ApifyPlaceResult[];
  try {
    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&format=json&clean=true`
    );
    const raw: unknown = await datasetRes.json();
    placeResults = Array.isArray(raw) ? (raw as ApifyPlaceResult[]) : [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dataset';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Extract and filter reviews: 4/5 stars only, max 25
  const rawReviews: ApifyReview[] = placeResults[0]?.reviews ?? [];
  const filtered = rawReviews
    .filter((r) => r.stars >= 4)
    .slice(0, 25);

  const reviews: Review[] = filtered.map((r) => ({
    reviewer: r.name,
    stars: r.stars,
    text: r.text,
    date: r.publishedAtDate
      ? new Date(r.publishedAtDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '',
  }));

  // Persist to leads.reviews_raw
  await supabase
    .from('leads')
    .update({ reviews_raw: reviews })
    .eq('id', leadId);

  return NextResponse.json({ reviews });
}
