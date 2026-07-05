import { describe, it, expect, vi } from 'vitest';
import { TriageService } from './triage-service';
import type { Extractor } from './extractor';
import type { EnquiryRepository } from './repository';
import type { Enquiry, Extraction } from './schemas';

const payload = { name: 'Sarah', email: 's@example.com', message: 'Buy pls', source: 'website' };

const extraction: Extraction = {
  intent: 'buy',
  property_address: '12 Reibey Street',
  budget: '$650k',
  urgency: 'high',
  summary: 'Buyer',
  draft_reply: 'Hi Sarah!',
};

function mockRepo() {
  return {
    insert: vi.fn(async (row) => ({ id: 'id-1', created_at: 'now', ...row }) as Enquiry),
    listNewestFirst: vi.fn(),
    latest: vi.fn(),
  } satisfies EnquiryRepository;
}

describe('TriageService', () => {
  it('happy path: stores extraction and returns extraction_ok true', async () => {
    const extractor: Extractor = { extract: vi.fn().mockResolvedValue(extraction) };
    const repo = mockRepo();
    const service = new TriageService(extractor, repo);
    const result = await service.process(payload);

    expect(result.extraction_ok).toBe(true);
    expect(result.draft_reply).toBe('Hi Sarah!');
    expect(result.enquiry.intent).toBe('buy');
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sarah',
        email: 's@example.com',
        message: 'Buy pls',
        intent: 'buy',
        urgency: 'high',
        status: 'new',
      })
    );
  });

  it('extractor failure: stores fallback, extraction_ok false, does not throw', async () => {
    const extractor: Extractor = { extract: vi.fn().mockRejectedValue(new Error('llm down')) };
    const repo = mockRepo();
    const service = new TriageService(extractor, repo);
    const result = await service.process(payload);

    expect(result.extraction_ok).toBe(false);
    expect(result.enquiry.intent).toBe('general');
    expect(result.enquiry.urgency).toBe('medium');
    expect(result.draft_reply).toContain('The Property Team');
    expect(repo.insert).toHaveBeenCalled();
  });

  it('repository failure propagates', async () => {
    const extractor: Extractor = { extract: vi.fn().mockResolvedValue(extraction) };
    const repo = mockRepo();
    repo.insert.mockRejectedValue(new Error('db down'));
    const service = new TriageService(extractor, repo);
    await expect(service.process(payload)).rejects.toThrow('db down');
  });

  it('stores the raw payload', async () => {
    const extractor: Extractor = { extract: vi.fn().mockResolvedValue(extraction) };
    const repo = mockRepo();
    await new TriageService(extractor, repo).process(payload);
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ raw: payload }));
  });
});
