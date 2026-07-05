import { getEnquiryRepository } from '@/lib/container';
import type { Enquiry, Intent, Urgency } from '@/lib/schemas';
import { TestEnquiryButton } from '@/components/TestEnquiryButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const urgencyStyles: Record<Urgency, string> = {
  high: 'bg-red-100 text-red-800 ring-red-600/20',
  medium: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  low: 'bg-green-100 text-green-800 ring-green-600/20',
};

const intentStyles: Record<Intent, string> = {
  buy: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  rent: 'bg-violet-100 text-violet-800 ring-violet-600/20',
  appraisal: 'bg-teal-100 text-teal-800 ring-teal-600/20',
  general: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${className}`}
    >
      {label}
    </span>
  );
}

async function fetchEnquiries(): Promise<{ enquiries: Enquiry[]; loadError: string | null }> {
  try {
    const enquiries = await getEnquiryRepository().listNewestFirst();
    return { enquiries, loadError: null };
  } catch (err) {
    console.error('Failed to load enquiries:', err);
    return { enquiries: [], loadError: 'storage unavailable' };
  }
}

export default async function Home() {
  const { enquiries, loadError } = await fetchEnquiries();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Harbourline Realty
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
              Property Enquiry Triage
            </h1>
          </div>
          <TestEnquiryButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-6 text-sm text-stone-500">
          {enquiries.length} enquir{enquiries.length === 1 ? 'y' : 'ies'}, newest
          first. Triaged automatically on arrival.
        </p>

        {loadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <p className="font-medium">Storage not ready</p>
            <p className="mt-1">
              Could not load enquiries ({loadError}). If this is a fresh setup, run{' '}
              <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> in the Supabase
              SQL editor, then reload.
            </p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <h2 className="font-serif text-lg text-stone-700">
              No enquiries yet
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              New enquiries land here automatically once the intake webhook
              receives them. Try the &ldquo;Send test enquiry&rdquo; button.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {enquiries.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    label={`${e.urgency} urgency`}
                    className={urgencyStyles[e.urgency] ?? urgencyStyles.medium}
                  />
                  <Badge
                    label={e.intent}
                    className={intentStyles[e.intent] ?? intentStyles.general}
                  />
                  {e.status !== 'new' && (
                    <Badge
                      label={e.status}
                      className="bg-stone-100 text-stone-600 ring-stone-500/20"
                    />
                  )}
                  <span
                    className="ml-auto text-xs text-stone-400"
                    title={new Date(e.created_at).toLocaleString()}
                  >
                    {relativeTime(e.created_at)}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-semibold text-stone-900">
                    {e.name ?? 'Unknown enquirer'}
                    {e.email && (
                      <span className="ml-2 font-normal text-stone-500">
                        {e.email}
                      </span>
                    )}
                    {e.source && (
                      <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-500">
                        via {e.source}
                      </span>
                    )}
                  </p>
                  {e.summary && (
                    <p className="mt-1 text-sm text-stone-700">{e.summary}</p>
                  )}
                  {(e.property_address || e.budget) && (
                    <p className="mt-1 text-xs text-stone-500">
                      {e.property_address && <span>{e.property_address}</span>}
                      {e.property_address && e.budget && (
                        <span className="mx-2">&middot;</span>
                      )}
                      {e.budget && <span>Budget: {e.budget}</span>}
                    </p>
                  )}
                </div>

                <details className="group mt-3 border-t border-stone-100 pt-3">
                  <summary className="cursor-pointer select-none text-xs font-medium text-emerald-700 hover:text-emerald-800">
                    Full message &amp; draft reply
                  </summary>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                        Original message
                      </p>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-stone-700">
                        {e.message}
                      </p>
                    </div>
                    {e.draft_reply && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                          Draft reply
                        </p>
                        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 text-stone-700">
                          {e.draft_reply}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
