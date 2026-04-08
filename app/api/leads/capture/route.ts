import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RequestBody {
  businessId: string;
  firstName: string;
  phone: string;
  message?: string;
}

async function sendLeadEmail(opts: {
  to: string;
  businessName: string;
  firstName: string;
  phone: string;
  message: string | null;
}): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const body = {
    from: fromEmail,
    to: [opts.to],
    subject: `New lead from your website — ${opts.firstName}`,
    html: `
      <p>You have a new contact form submission from your website.</p>
      <table cellpadding="6" style="font-family:sans-serif;font-size:14px;">
        <tr><td><strong>Name</strong></td><td>${opts.firstName}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${opts.phone}</td></tr>
        ${opts.message ? `<tr><td><strong>Message</strong></td><td>${opts.message}</td></tr>` : ''}
      </table>
    `.trim(),
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, firstName, phone, message } = body;

  if (!businessId || !firstName || !phone) {
    return NextResponse.json(
      { error: 'businessId, firstName, and phone are required' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Insert the site lead
  const { error: insertError } = await supabase.from('site_leads').insert({
    business_id: businessId,
    first_name: firstName,
    phone,
    message: message ?? null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Look up the business's contact_email via leads
  const { data: business } = await supabase
    .from('businesses')
    .select('lead_id, name')
    .eq('id', businessId)
    .maybeSingle();

  if (business?.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('contact_email')
      .eq('id', business.lead_id)
      .maybeSingle();

    if (lead?.contact_email) {
      try {
        await sendLeadEmail({
          to: lead.contact_email,
          businessName: business.name ?? '',
          firstName,
          phone,
          message: message ?? null,
        });
      } catch (err) {
        // Log but don't fail the request — lead is already saved
        console.error('Resend error:', err instanceof Error ? err.message : err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
