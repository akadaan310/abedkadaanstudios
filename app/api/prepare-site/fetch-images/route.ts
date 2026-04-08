import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ApifyRunResponse {
  data?: {
    id?: string;
    defaultDatasetId?: string;
  };
}

interface ApifyImage {
  imageUrl?: string;
  url?: string;
}

interface ApifyPlaceResult {
  images?: (ApifyImage | string)[];
  imageUrls?: string[];
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
          maxImages: 25,
          scrapeImages: true,
          maxReviews: 0,
          includeOpeningHours: false,
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

  const place = placeResults[0];

  // Extract from `images` array (objects with imageUrl/url, or bare strings)
  const fromImages = (place?.images ?? [])
    .map((img) => (typeof img === 'string' ? img : (img.imageUrl ?? img.url ?? '')))
    .filter(Boolean);

  // Fall back to top-level `imageUrls` array if `images` yielded nothing
  const imageUrls = fromImages.length > 0 ? fromImages : (place?.imageUrls ?? []).filter(Boolean);

  return NextResponse.json({ imageUrls });
}
