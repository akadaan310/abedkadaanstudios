import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  };

  const { name, email, phone, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);

  try {
    await resend.emails.send({
      from: 'Studio <hello@abedkadaan.com>',
      to: ['abed@abedkadaan.com'],
      replyTo: email,
      subject: `New inquiry from ${name}`,
      html: `
        <h2>New project inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone ?? 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
