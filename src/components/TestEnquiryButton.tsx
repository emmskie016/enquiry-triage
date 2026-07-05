'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendTestEnquiry } from '@/app/actions';

const SAMPLE_COUNT = 4;

type Status = 'idle' | 'sending' | 'success' | 'error';

export function TestEnquiryButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');

  async function send() {
    setStatus('sending');
    try {
      const result = await sendTestEnquiry(Math.floor(Math.random() * SAMPLE_COUNT));
      if (!result.ok) throw new Error(result.error);
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
          Failed to send test enquiry.
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
