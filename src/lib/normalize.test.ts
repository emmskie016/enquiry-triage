import { describe, expect, it } from 'vitest';
import { normalizeExtraction } from './normalize';

describe('normalizeExtraction', () => {
  it('passes through a fully valid extraction', () => {
    const result = normalizeExtraction({
      intent: 'buy',
      urgency: 'high',
      property_address: '14 Elm Grove, Hawthorn',
      budget: '$1.2M',
      summary: 'Buyer ready to move quickly on a 3BR in Richmond.',
      draft_reply: 'Hi Sarah, thanks for reaching out...',
    });
    expect(result).toEqual({
      intent: 'buy',
      urgency: 'high',
      property_address: '14 Elm Grove, Hawthorn',
      budget: '$1.2M',
      summary: 'Buyer ready to move quickly on a 3BR in Richmond.',
      draft_reply: 'Hi Sarah, thanks for reaching out...',
    });
  });

  it('clamps unknown intent and urgency to safe defaults', () => {
    const result = normalizeExtraction({
      intent: 'sell-my-soul',
      urgency: 'EXTREME',
      summary: 'x',
    });
    expect(result.intent).toBe('general');
    expect(result.urgency).toBe('medium');
  });

  it('accepts mixed-case enum values', () => {
    const result = normalizeExtraction({ intent: 'Rent', urgency: 'HIGH' });
    expect(result.intent).toBe('rent');
    expect(result.urgency).toBe('high');
  });

  it('returns safe defaults for null input', () => {
    expect(normalizeExtraction(null)).toEqual({
      intent: 'general',
      urgency: 'medium',
      property_address: null,
      budget: null,
      summary: '',
      draft_reply: '',
    });
  });

  it('returns safe defaults for garbage input (string, array, number)', () => {
    for (const garbage of ['not json', [1, 2, 3], 42, undefined]) {
      const result = normalizeExtraction(garbage);
      expect(result.intent).toBe('general');
      expect(result.urgency).toBe('medium');
    }
  });

  it('normalizes empty/whitespace strings and wrong types to null/defaults', () => {
    const result = normalizeExtraction({
      intent: 7,
      urgency: {},
      property_address: '   ',
      budget: 1200000,
      summary: null,
      draft_reply: '  Hi Jay  ',
    });
    expect(result).toEqual({
      intent: 'general',
      urgency: 'medium',
      property_address: null,
      budget: null,
      summary: '',
      draft_reply: 'Hi Jay',
    });
  });
});
