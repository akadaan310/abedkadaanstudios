import { NextRequest, NextResponse } from 'next/server';

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { query: string; page?: number };
  try {
    body = (await req.json()) as { query: string; page?: number };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, page = 1 } = body;
  if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

  let data: UnsplashSearchResponse;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}&client_id=${UNSPLASH_ACCESS_KEY}`,
      { headers: { 'Accept-Version': 'v1' } }
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Unsplash error ${res.status}: ${text}` }, { status: 500 });
    }
    data = (await res.json()) as UnsplashSearchResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unsplash request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const urls = (data.results ?? []).map((p) => p.urls.regular);
  return NextResponse.json({ urls, total: data.total ?? 0, totalPages: data.total_pages ?? 0 });
}
