# Demo Script & Operations Guide

## Loom walkthrough (~4 min)

1. **Repo + spec (45s)** — Open `specs/001-secure-triage-app/`. Spec-first: requirements → plan → tasks, then TDD (37 tests written before the code). Show the architecture diagram in the README.
2. **Architecture (1 min)** — `src/lib/`: zod schemas as the single source of truth for types/enums; `TriageService` with injected `Extractor` and `EnquiryRepository` interfaces; constant-time webhook-secret check and a sliding-window rate limiter. Error policy: an LLM failure falls back to safe defaults and still stores the lead (`extraction_ok:false`); a database failure fails loudly. This was proven live when the LLM account briefly ran out of credits — no lead was lost.
3. **Live demo (1 min)** — Run the curl below, read the extracted JSON (intent buy, 12 Reibey Street, $650k, urgency high, personalised draft reply), then show the dashboard and click "Send test enquiry" (includes a deliberately messy sample that still lands cleanly).
4. **Voice bonus (45s)** — Retell agent "Enquiry Triage Reader (Trial)" (test via Retell dashboard web call) reads the latest enquiry over `GET /api/latest-enquiry` — secret-gated, email excluded.
5. **Trade-offs (30s)** — Single LLM call for extraction + reply; in-memory rate limiter (Upstash in prod); static shared secret (HMAC signing in prod); dashboard unauthenticated in trial scope.

## Trigger the webhook

```bash
curl -X POST https://enquiry-triage-tvs-ai.vercel.app/api/enquiry \
  -H 'Content-Type: application/json' \
  -H 'x-webhook-secret: <WEBHOOK_SECRET>' \
  -d '{"name":"Sarah Nguyen","email":"sarah.n@example.com","source":"website","message":"Hi, we saw 12 Reibey Street and are keen. Looking to buy in the next month, budget around $650k. Can someone call us to arrange an inspection?"}'
```

Expected: `201` with `{ok, enquiry, draft_reply, extraction_ok}`. Without the secret: `401`. Invalid payload: `400` with field-level errors. Over 10 req/min per IP: `429`.

## Operating it

- **Data**: Supabase → Table Editor → `enquiries` (RLS on, service-role only).
- **Logs**: Vercel → project `enquiry-triage` → Functions logs (DB/LLM errors are logged server-side only; clients get generic messages).
- **Redeploy**: push to `main`, then `vercel --prod --yes` (project already linked).
- **Tests**: `npm test` (37 vitest tests) · `npm run lint` · `npm run build`.
- **Env vars (Vercel, production)**: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `LATEST_ENQUIRY_TOKEN`, `NEXT_PUBLIC_APP_URL`.
- **Voice agent**: Retell tool points at `/api/latest-enquiry` with header `x-api-key: <LATEST_ENQUIRY_TOKEN>`.

## Post-trial hygiene

Rotate the Supabase service_role key, Anthropic API key, and Retell API key; the retired n8n workflow "[Trial] Property Enquiry Triage Agent" can be deleted.
