'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'sending' | 'success' | 'error';

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
      "Hello, my partner and I are relocating for work and need a 2-bed rental near the CBD from next month. Budget is about $750/week. Pet-friendly would be ideal (small dog).",
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

export function TestEnquiryButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');

  async function send() {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    if (!webhookUrl) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      setStatus('success');
      router.refresh();
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status === 'success' && (
        <span className="text-xs font-medium text-emerald-700">
          Enquiry sent — refreshing…
        </span>
      )}
      {status === 'error' && (
        <span className="text-xs font-medium text-red-600">
          Failed to send. Check NEXT_PUBLIC_WEBHOOK_URL.
        </span>
      )}
      <button
        onClick={send}
        disabled={status === 'sending'}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send test enquiry'}
      </button>
    </div>
  );
}
