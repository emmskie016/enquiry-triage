import { fallbackExtraction, type Extractor } from './extractor';
import type { EnquiryRepository } from './repository';
import type { Enquiry, EnquiryPayload, Extraction } from './schemas';

export interface TriageResult {
  enquiry: Enquiry;
  draft_reply: string;
  extraction_ok: boolean;
}

/**
 * Orchestrates extraction + persistence (FR-005, FR-007).
 * Extractor errors never lose the enquiry — the fallback is stored instead.
 * Repository errors DO propagate: data loss is a real failure the route
 * maps to a generic 500.
 */
export class TriageService {
  constructor(
    private readonly extractor: Extractor,
    private readonly repository: EnquiryRepository
  ) {}

  async process(payload: EnquiryPayload): Promise<TriageResult> {
    let extraction: Extraction;
    let extractionOk = true;
    try {
      extraction = await this.extractor.extract(payload);
    } catch (err) {
      console.error('Extraction failed, storing fallback:', err);
      extraction = fallbackExtraction(payload);
      extractionOk = false;
    }

    const enquiry = await this.repository.insert({
      name: payload.name ?? null,
      email: payload.email ?? null,
      source: payload.source ?? null,
      message: payload.message,
      raw: payload as Record<string, unknown>,
      status: 'new',
      ...extraction,
    });

    return { enquiry, draft_reply: extraction.draft_reply, extraction_ok: extractionOk };
  }
}
