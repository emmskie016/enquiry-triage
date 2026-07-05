import { NextResponse } from 'next/server';
import { getEnquiryRepository } from '@/lib/container';

export const dynamic = 'force-dynamic';

// Read-side endpoint for the Retell voice agent: returns the most recent
// enquiry in a shape the agent can read back to the caller (FR-010).
// Gated by a shared secret; email is never included.
export async function GET(req: Request) {
  const token = process.env.LATEST_ENQUIRY_TOKEN;
  if (!token || req.headers.get('x-api-key') !== token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const e = await getEnquiryRepository().latest();
    if (!e) {
      return NextResponse.json({
        ok: true,
        enquiry: null,
        spoken: 'There are no enquiries on file yet.',
      });
    }

    const parts = [
      `The latest enquiry is from ${e.name ?? 'an unknown contact'}.`,
      `Intent: ${e.intent}.`,
      e.property_address ? `Property: ${e.property_address}.` : null,
      e.budget ? `Budget: ${e.budget}.` : null,
      `Urgency: ${e.urgency}.`,
      `Summary: ${e.summary}`,
    ].filter(Boolean);

    return NextResponse.json({ ok: true, enquiry: e, spoken: parts.join(' ') });
  } catch (err) {
    console.error('latest-enquiry failed:', err);
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}
