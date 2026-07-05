-- Property Enquiry Triage — Supabase schema
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text,
  source text,
  message text not null,
  raw jsonb,
  intent text not null default 'general',
  property_address text,
  budget text,
  urgency text not null default 'medium',
  summary text,
  draft_reply text,
  status text not null default 'new'
);

-- Lock the table down: RLS enabled with no policies means anon/authenticated
-- clients get nothing. Only the service role key (used server-side by n8n and
-- the dashboard) can read/write.
alter table public.enquiries enable row level security;
