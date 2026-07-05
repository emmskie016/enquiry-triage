import type { Intent, Urgency } from './types';

const INTENTS: Intent[] = ['buy', 'rent', 'appraisal', 'general'];
const URGENCIES: Urgency[] = ['low', 'medium', 'high'];

export interface NormalizedExtraction {
  intent: Intent;
  urgency: Urgency;
  property_address: string | null;
  budget: string | null;
  summary: string;
  draft_reply: string;
}

const DEFAULTS: NormalizedExtraction = {
  intent: 'general',
  urgency: 'medium',
  property_address: null,
  budget: null,
  summary: '',
  draft_reply: '',
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates and normalizes an LLM extraction result into a safe,
 * strictly-typed object. Any missing, malformed, or out-of-enum values
 * fall back to conservative defaults.
 */
export function normalizeExtraction(input: unknown): NormalizedExtraction {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULTS };
  }

  const obj = input as Record<string, unknown>;

  const intentRaw = asTrimmedString(obj.intent)?.toLowerCase();
  const intent: Intent = INTENTS.includes(intentRaw as Intent)
    ? (intentRaw as Intent)
    : DEFAULTS.intent;

  const urgencyRaw = asTrimmedString(obj.urgency)?.toLowerCase();
  const urgency: Urgency = URGENCIES.includes(urgencyRaw as Urgency)
    ? (urgencyRaw as Urgency)
    : DEFAULTS.urgency;

  return {
    intent,
    urgency,
    property_address: asTrimmedString(obj.property_address),
    budget: asTrimmedString(obj.budget),
    summary: asTrimmedString(obj.summary) ?? DEFAULTS.summary,
    draft_reply: asTrimmedString(obj.draft_reply) ?? DEFAULTS.draft_reply,
  };
}
