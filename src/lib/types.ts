export type Intent = 'buy' | 'rent' | 'appraisal' | 'general';
export type Urgency = 'low' | 'medium' | 'high';

export interface Enquiry {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  source: string | null;
  message: string;
  raw: Record<string, unknown> | null;
  intent: Intent;
  property_address: string | null;
  budget: string | null;
  urgency: Urgency;
  summary: string | null;
  draft_reply: string | null;
  status: string;
}
