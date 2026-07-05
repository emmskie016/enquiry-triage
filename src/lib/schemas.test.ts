import { describe, it, expect } from 'vitest';
import { EnquiryPayloadSchema, ExtractionSchema } from './schemas';

describe('EnquiryPayloadSchema', () => {
  it('accepts a full valid payload', () => {
    const result = EnquiryPayloadSchema.safeParse({
      name: 'Sarah Nguyen',
      email: 'sarah@example.com',
      message: 'Looking to buy',
      source: 'website',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a message-only payload', () => {
    const result = EnquiryPayloadSchema.safeParse({ message: 'hi' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
    }
  });

  it('rejects a missing message', () => {
    const result = EnquiryPayloadSchema.safeParse({ name: 'Bob' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty/whitespace message', () => {
    expect(EnquiryPayloadSchema.safeParse({ message: '' }).success).toBe(false);
    expect(EnquiryPayloadSchema.safeParse({ message: '   ' }).success).toBe(false);
  });

  it('rejects a non-string message', () => {
    expect(EnquiryPayloadSchema.safeParse({ message: 42 }).success).toBe(false);
  });
});

describe('ExtractionSchema', () => {
  const valid = {
    intent: 'buy',
    property_address: '12 Reibey Street',
    budget: '$650k',
    urgency: 'high',
    summary: 'Buyer enquiry',
    draft_reply: 'Hi Sarah, thanks for reaching out.',
  };

  it('accepts a valid extraction', () => {
    const result = ExtractionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts null property_address and budget', () => {
    const result = ExtractionSchema.safeParse({
      ...valid,
      property_address: null,
      budget: null,
    });
    expect(result.success).toBe(true);
  });

  it('clamps enum case (BUY -> buy)', () => {
    const result = ExtractionSchema.safeParse({ ...valid, intent: 'BUY', urgency: ' High ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intent).toBe('buy');
      expect(result.data.urgency).toBe('high');
    }
  });

  it('rejects out-of-enum intent', () => {
    expect(ExtractionSchema.safeParse({ ...valid, intent: 'sell-house' }).success).toBe(false);
  });

  it('rejects out-of-enum urgency', () => {
    expect(ExtractionSchema.safeParse({ ...valid, urgency: 'urgent!!' }).success).toBe(false);
  });

  it('coerces empty-string nullable fields to null', () => {
    const result = ExtractionSchema.safeParse({ ...valid, budget: '  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBeNull();
  });

  it('rejects missing summary/draft_reply', () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.summary;
    expect(ExtractionSchema.safeParse(rest).success).toBe(false);
  });
});
