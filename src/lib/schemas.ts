import { z } from 'zod';

// --- Single source of truth for enums & shapes ---

export const IntentSchema = z.enum(['buy', 'rent', 'appraisal', 'general']);
export const UrgencySchema = z.enum(['low', 'medium', 'high']);

export type Intent = z.infer<typeof IntentSchema>;
export type Urgency = z.infer<typeof UrgencySchema>;

/** Clamps enum case/whitespace ("BUY " -> "buy") before validating. */
const clampEnumInput = (v: unknown) =>
  typeof v === 'string' ? v.trim().toLowerCase() : v;

/** Trims strings; empty strings become null. */
const nullableTrimmedString = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

/** Incoming webhook payload (FR-001). */
export const EnquiryPayloadSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  message: z
    .string({ error: 'message is required and must be a string' })
    .trim()
    .min(1, 'message must be a non-empty string'),
  source: z.string().optional(),
});

export type EnquiryPayload = z.infer<typeof EnquiryPayloadSchema>;

/** LLM extraction output (FR-004). Out-of-enum values fail validation
 *  (the caller falls back); casing/whitespace is clamped. */
export const ExtractionSchema = z.object({
  intent: z.preprocess(clampEnumInput, IntentSchema),
  property_address: nullableTrimmedString,
  budget: nullableTrimmedString,
  urgency: z.preprocess(clampEnumInput, UrgencySchema),
  summary: z.string().trim().min(1),
  draft_reply: z.string().trim().min(1),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

/** A stored enquiry row. */
export interface Enquiry extends Extraction {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  source: string | null;
  message: string;
  raw: Record<string, unknown> | null;
  status: string;
}

/** Voice-agent view of the latest enquiry — never includes email. */
export type LatestEnquiry = Pick<
  Enquiry,
  'name' | 'intent' | 'property_address' | 'budget' | 'urgency' | 'summary' | 'created_at'
>;
