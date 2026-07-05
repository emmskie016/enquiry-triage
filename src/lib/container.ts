import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabase } from './supabase';
import { AnthropicExtractor } from './extractor';
import { SupabaseEnquiryRepository, type EnquiryRepository } from './repository';
import { TriageService } from './triage-service';

// Lazy singletons so builds succeed without env vars set.
let repository: EnquiryRepository | null = null;
let triageService: TriageService | null = null;

export function getEnquiryRepository(): EnquiryRepository {
  if (!repository) {
    repository = new SupabaseEnquiryRepository(getSupabase());
  }
  return repository;
}

export function getTriageService(): TriageService {
  if (!triageService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY environment variable.');
    triageService = new TriageService(
      new AnthropicExtractor(new Anthropic({ apiKey })),
      getEnquiryRepository()
    );
  }
  return triageService;
}
