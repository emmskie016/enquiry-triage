# Plan 001 — Technical Design

## Stack
Next.js 15 App Router (existing repo), TypeScript strict, zod, @anthropic-ai/sdk,
@supabase/supabase-js, vitest. Deployed to Vercel (existing project `enquiry-triage`).

## Architecture (OOP, DI, DRY)
```
src/lib/
  schemas.ts          # zod: EnquiryPayloadSchema, ExtractionSchema; types derived (single source of truth)
  security.ts         # verifySecret(constant-time via timingSafeEqual), RateLimiter class (sliding window)
  extractor.ts        # interface Extractor { extract(e): Promise<Extraction> }
                      # class AnthropicExtractor implements Extractor (tool-forced JSON, zod-validates output)
                      # fallbackExtraction(payload) — shared by extractor failure paths (DRY with normalize.ts logic)
  repository.ts       # interface EnquiryRepository { insert; listNewestFirst; latest }
                      # class SupabaseEnquiryRepository implements EnquiryRepository
  triage-service.ts   # class TriageService(extractor, repository) { process(payload): TriageResult }
  container.ts        # createTriageService() factory wiring real deps from env (lazy, server-only)
src/app/api/enquiry/route.ts        # auth → rate limit → zod parse → TriageService.process → 201
src/app/api/latest-enquiry/route.ts # x-api-key gate → repository.latest → spoken string
src/app/page.tsx                    # uses repository.listNewestFirst via container
```

## Key decisions
1. **Single LLM call** for extraction + draft reply (cost/latency; coupling accepted, documented).
2. **TriageService never throws for LLM problems** — catches extractor errors, applies fallback,
   sets `extraction_ok:false`. Repository errors DO propagate (data loss is a real failure) → route maps to 500 generic.
3. **In-memory rate limiter** — honest trial trade-off; interface allows Upstash swap.
4. **Retell tool** keeps pointing at `/api/latest-enquiry` (unchanged contract, email removed).
5. n8n workflow `Tj07BsEIxTRjaTXf` deactivated after E2E passes on the new route.

## Test plan (TDD order)
1. schemas: valid/invalid payloads, enum clamping via ExtractionSchema.
2. security: verifySecret (match/mismatch/missing/length-diff), RateLimiter window behaviour.
3. extractor: AnthropicExtractor with mocked SDK (tool_use parse, garbage output → throws), fallbackExtraction shape.
4. triage-service: happy path (mock extractor+repo), extractor failure → fallback stored, repo failure → propagates.
5. route-level: exercised indirectly; thin routes keep logic in tested units.

## Env additions
`ANTHROPIC_API_KEY` (required — from user), `WEBHOOK_SECRET` (generate).
