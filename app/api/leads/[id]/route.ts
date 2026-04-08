import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_FIELDS = new Set(['status', 'notes', 'purchased_domain', 'contact_email']);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      return NextResponse.json({ error: `Field '${key}' is not allowed` }, { status: 400 });
    }
  }

  const supabase = createClient();

  // Verify lead exists
  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  // Build update payload
  const update: Record<string, unknown> = { ...body };

  if ('purchased_domain' in body && body.purchased_domain) {
    update.status = 'purchased';
    update.sold_at = new Date().toISOString();
  }

  // Apply update
  const { data: updated, error: updateError } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // If purchased_domain set, upsert custom_domains (requires a business row)
  if ('purchased_domain' in body && body.purchased_domain) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('lead_id', id)
      .maybeSingle();

    if (business) {
      await supabase.from('custom_domains').upsert(
        {
          business_id: business.id,
          domain: body.purchased_domain as string,
          verified: false,
        },
        { onConflict: 'domain' }
      );
    }
  }

  return NextResponse.json(updated);
}
