import { NextRequest, NextResponse } from 'next/server';
import type { ApifyPlace } from '@/types/lead';
import { ingestPlaces } from './process';

interface ApifyRunResponse {
  data?: {
    id?: string;
    defaultDatasetId?: string;
  };
}

interface ApifyDatasetResponse {
  items: ApifyPlace[];
}

interface RequestBody {
  location: string;
  category: string;
  targetLeads: number;
  conversionEstimate: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { location, category, targetLeads, conversionEstimate } = body;

  if (!location || !category || !targetLeads || !conversionEstimate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const APIFY_API_KEY = process.env.APIFY_API_KEY!;
  const scrapeCount = Math.ceil(targetLeads / conversionEstimate);

  // Trigger Apify run (synchronous wait up to 300s)
  let runData: ApifyRunResponse;
  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_API_KEY}&waitForFinish=300`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchStringsArray: [`${category} near ${location}`],
          maxCrawledPlacesPerSearch: scrapeCount,
          maxReviews: 0,
          maxImages: 0,
          includeOpeningHours: true,
          skipClosedPlaces: true,
          skipWithWebsite: true,
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
  let places: ApifyPlace[];
  try {
    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}&format=json&clean=true`
    );
    const datasetData = (await datasetRes.json()) as ApifyDatasetResponse | ApifyPlace[];
    // Dataset endpoint returns either { items: [] } or a bare array depending on version
    places = Array.isArray(datasetData)
      ? datasetData
      : (datasetData as ApifyDatasetResponse).items ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dataset';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Filter: must have a phone number and no website
  // skipWithWebsite in Apify input is unreliable — enforce manually on the response
  const eligiblePlaces = places.filter((p) => p.phone?.trim() && !p.website?.trim());

  // Insert into DB
  const { inserted, skipped } = await ingestPlaces(eligiblePlaces, category, location);

  return NextResponse.json({
    inserted,
    skipped,
    total: inserted + skipped,
    totalScraped: places.length,
  });
}
