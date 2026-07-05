import { NextResponse } from 'next/server';
import { getTriageService } from '@/lib/container';
import { EnquiryPayloadSchema } from '@/lib/schemas';
import { RateLimiter, verifySecret } from '@/lib/security';

export const dynamic = 'force-dynamic';

// FR-008: 10 requests/min per IP. In-memory — documented trade-off.
const limiter = new RateLimiter(10, 60_000);

export async function POST(req: Request) {
  // 1. Auth (constant-time, FR-002)
  if (!verifySecret(req.headers.get('x-webhook-secret'), process.env.WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // 2. Rate limit (FR-008)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (!limiter.allow(ip)) {
    return NextResponse.json({ ok: false, error: 'rate limit exceeded' }, { status: 429 });
  }

  // 3. Validate (FR-001, FR-003)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }
  const parsed = EnquiryPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 4. Process (FR-004..007)
  try {
    const result = await getTriageService().process(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        enquiry: result.enquiry,
        draft_reply: result.draft_reply,
        extraction_ok: result.extraction_ok,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Enquiry processing failed:', err);
    // Never leak internals (FR-007)
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}
