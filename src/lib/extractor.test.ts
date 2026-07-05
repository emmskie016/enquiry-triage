import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { AnthropicExtractor, fallbackExtraction } from './extractor';

const payload = {
  name: 'Sarah Nguyen',
  email: 'sarah@example.com',
  message: 'Hi, looking to buy at 12 Reibey Street, budget $650k, urgently!',
  source: 'website',
};

function mockClient(response: unknown) {
  return {
    messages: { create: vi.fn().mockResolvedValue(response) },
  } as unknown as Anthropic;
}

describe('AnthropicExtractor', () => {
  const goodToolUse = {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'triage_enquiry',
        input: {
          intent: 'buy',
          property_address: '12 Reibey Street',
          budget: '$650k',
          urgency: 'high',
          summary: 'Wants to buy at 12 Reibey Street, budget $650k.',
          draft_reply: 'Hi Sarah, thanks for reaching out!',
        },
      },
    ],
  };

  it('parses a forced tool_use response', async () => {
    const client = mockClient(goodToolUse);
    const extractor = new AnthropicExtractor(client);
    const result = await extractor.extract(payload);
    expect(result.intent).toBe('buy');
    expect(result.property_address).toBe('12 Reibey Street');
    expect(result.urgency).toBe('high');
  });

  it('forces the triage_enquiry tool with the right model', async () => {
    const client = mockClient(goodToolUse);
    await new AnthropicExtractor(client).extract(payload);
    const args = (client.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.model).toBe('claude-haiku-4-5-20251001');
    expect(args.tool_choice).toEqual({ type: 'tool', name: 'triage_enquiry' });
    expect(args.tools[0].name).toBe('triage_enquiry');
  });

  it('throws when the response has no tool_use block', async () => {
    const client = mockClient({ content: [{ type: 'text', text: 'nope' }] });
    await expect(new AnthropicExtractor(client).extract(payload)).rejects.toThrow();
  });

  it('throws on garbage tool output (schema validation)', async () => {
    const client = mockClient({
      content: [{ type: 'tool_use', id: 't', name: 'triage_enquiry', input: { intent: 'banana' } }],
    });
    await expect(new AnthropicExtractor(client).extract(payload)).rejects.toThrow();
  });

  it('propagates API errors', async () => {
    const client = {
      messages: { create: vi.fn().mockRejectedValue(new Error('overloaded')) },
    } as unknown as Anthropic;
    await expect(new AnthropicExtractor(client).extract(payload)).rejects.toThrow('overloaded');
  });
});

describe('fallbackExtraction', () => {
  it('returns safe defaults', () => {
    const result = fallbackExtraction(payload);
    expect(result.intent).toBe('general');
    expect(result.urgency).toBe('medium');
    expect(result.property_address).toBeNull();
    expect(result.budget).toBeNull();
    expect(result.draft_reply).toContain('The Property Team');
  });

  it('summary is the first 120 chars of the message', () => {
    const long = { message: 'x'.repeat(300) };
    expect(fallbackExtraction(long).summary).toHaveLength(120);
    expect(fallbackExtraction(payload).summary).toBe(payload.message);
  });
});
