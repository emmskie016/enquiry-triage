'use server';

// Server action proxy for the dashboard's test button: the webhook secret
// stays server-side and never reaches the client.

const SAMPLES = [
  {
    name: 'Sarah Nguyen',
    email: 'sarah.nguyen@example.com',
    source: 'website',
    message:
      "Hi, I'm looking to buy a 3-bedroom house in Richmond, budget around $1.2M. We've just sold our apartment so we're ready to move quickly — could someone call me this week?",
  },
  {
    name: 'Tom Barker',
    email: 'tom.barker@example.com',
    source: 'website',
    message:
      'Hello, my partner and I are relocating for work and need a 2-bed rental near the CBD from next month. Budget is about $750/week. Pet-friendly would be ideal (small dog).',
  },
  {
    name: 'Maria Kovacs',
    email: 'maria.k@example.com',
    source: 'facebook',
    message:
      "Hi there, we're thinking about selling our townhouse at 14 Elm Grove, Hawthorn sometime this year. Could we get an appraisal to see what it might be worth? No rush.",
  },
  {
    name: 'jay',
    email: 'jay123@example.com',
    source: 'website',
    message: 'hey saw ur listing... how much?? also is it still avail lol',
  },
];

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function sendTestEnquiry(
  sampleIndex: number
): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return { ok: false, error: 'WEBHOOK_SECRET is not configured' };

  const sample = SAMPLES[Math.abs(Math.trunc(sampleIndex)) % SAMPLES.length];
  try {
    const res = await fetch(`${baseUrl()}/api/enquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify(sample),
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: `webhook returned ${res.status}` };
    return { ok: true };
  } catch (err) {
    console.error('sendTestEnquiry failed:', err);
    return { ok: false, error: 'request failed' };
  }
}
