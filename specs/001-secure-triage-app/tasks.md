# Tasks 001

- [x] T01 Add deps: zod, @anthropic-ai/sdk. (FR-003, FR-004)
- [x] T02 TDD `src/lib/schemas.ts` — payload + extraction zod schemas, derived types; migrate/replace normalize.ts logic. (FR-001, FR-003; SC-001)
- [x] T03 TDD `src/lib/security.ts` — verifySecret (timingSafeEqual), RateLimiter class. (FR-002, FR-008)
- [x] T04 TDD `src/lib/extractor.ts` — Extractor interface, AnthropicExtractor (mocked SDK in tests), fallbackExtraction. (FR-004, FR-005)
- [x] T05 TDD `src/lib/repository.ts` — EnquiryRepository interface, SupabaseEnquiryRepository (mocked client). (FR-006)
- [x] T06 TDD `src/lib/triage-service.ts` — TriageService orchestration incl. fallback + error policy. (FR-005, FR-007)
- [x] T07 `src/lib/container.ts` + rewrite `/api/enquiry` route (auth → rate limit → parse → process). (FR-001..008)
- [x] T08 Rework `/api/latest-enquiry` + page.tsx onto repository. (FR-009, FR-010)
- [x] T09 Security headers in next.config; update .env.example, README (architecture, curl w/ secret, trade-offs). (NFR-003)
- [x] T10 Update TestEnquiryButton → posts to /api/enquiry with NEXT_PUBLIC test path (server action proxy so secret stays server-side).
- [x] T11 Full suite + build + lint green; commit. (SC-001, SC-002)
- [ ] T12 Deploy: set WEBHOOK_SECRET + ANTHROPIC_API_KEY envs, vercel --prod. (SC-002)
- [ ] T13 E2E: Sarah sample + messy sample; verify dashboard + voice endpoint; deactivate n8n wf. (SC-003, SC-004)
