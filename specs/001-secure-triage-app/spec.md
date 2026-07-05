# Spec 001 — Secure All-in-Next.js Property Enquiry Triage

## Intent
Replace the n8n intake with a single, self-contained, secure Next.js app that accepts a
real-estate enquiry webhook, extracts structured fields with Claude, stores everything in
Supabase, returns a personalised draft reply, and lists enquiries on a dashboard.

## Functional Requirements
- FR-001 `POST /api/enquiry` accepts JSON `{name?, email?, message, source?}`; `message` required non-empty string.
- FR-002 Requests must carry header `x-webhook-secret` matching env `WEBHOOK_SECRET`; otherwise 401. Comparison is constant-time.
- FR-003 Payload validated with zod; invalid → 400 with field-level errors, nothing stored.
- FR-004 LLM extraction via Anthropic (claude-haiku-4-5, tool-forced JSON): intent (buy|rent|appraisal|general), property_address|null, budget|null, urgency (low|medium|high), summary, draft_reply — one LLM call.
- FR-005 LLM failure or invalid output MUST NOT lose the enquiry: store with defaults (intent=general, urgency=medium, summary=message excerpt, generic fallback reply); response flags `extraction_ok:false`.
- FR-006 Raw payload + extracted fields + draft_reply persisted to Supabase `enquiries` (service-role, server-only).
- FR-007 Webhook response: 201 `{ok, enquiry, draft_reply}` (no internal error details ever leaked).
- FR-008 Rate limiting: max 10 requests/min per IP → 429. In-memory sliding window (documented trade-off; Upstash in prod).
- FR-009 Dashboard `/` lists enquiries newest-first with badges, expandable message/draft; degrades to generic "storage unavailable" notice (no error internals).
- FR-010 `GET /api/latest-enquiry` (voice agent): requires `x-api-key` = env `LATEST_ENQUIRY_TOKEN`; returns latest enquiry summary + `spoken` string; excludes email.

## Non-Functional / Security
- NFR-001 No secrets in repo; all via env (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `LATEST_ENQUIRY_TOKEN`).
- NFR-002 RLS enabled, no anon policies; all DB access server-side.
- NFR-003 Security headers (nosniff, frame-deny, referrer-policy) via next.config.
- NFR-004 OOP + DRY: interfaces (`Extractor`, `EnquiryRepository`), classes (`AnthropicExtractor`, `SupabaseEnquiryRepository`, `TriageService`), constructor injection; single source of truth for enums/schemas (zod-derived types).

## Success Criteria
- SC-001 Vitest suite green: schema validation, secret auth, rate limiter, extractor fallback, TriageService orchestration (LLM + repo mocked).
- SC-002 `npm run build` and lint pass; deployed on Vercel publicly reachable.
- SC-003 E2E: Sarah Nguyen sample → 201 with intent=buy, address "12 Reibey Street", budget ≈ $650k, urgency high; row visible on dashboard.
- SC-004 Messy message ("hey saw ur listing... how much??") → still stored, valid enums, sensible reply.

## Out of Scope
Dashboard auth, audit logging, CSP, distributed rate limiting, email sending, n8n (retired at cutover).
