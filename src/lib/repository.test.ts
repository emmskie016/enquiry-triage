import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseEnquiryRepository } from './repository';

const row = {
  id: 'uuid-1',
  created_at: '2026-07-06T00:00:00Z',
  name: 'Sarah',
  email: 's@example.com',
  source: 'website',
  message: 'hello',
  raw: {},
  intent: 'buy',
  property_address: null,
  budget: null,
  urgency: 'high',
  summary: 'sum',
  draft_reply: 'reply',
  status: 'new',
};

// Chainable query builder mock resolving to a supabase-style result.
function mockSupabase(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const m of ['insert', 'select', 'order', 'limit']) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue(result);
  // make the builder awaitable for list-style queries
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
  const client = { from: vi.fn().mockReturnValue(builder) } as unknown as SupabaseClient;
  return { client, builder };
}

describe('SupabaseEnquiryRepository', () => {
  it('insert returns the inserted enquiry', async () => {
    const { client, builder } = mockSupabase({ data: row, error: null });
    const repo = new SupabaseEnquiryRepository(client);
    const inserted = await repo.insert(row);
    expect(inserted.id).toBe('uuid-1');
    expect(client.from).toHaveBeenCalledWith('enquiries');
    expect(builder.insert).toHaveBeenCalled();
  });

  it('insert throws on error', async () => {
    const { client } = mockSupabase({ data: null, error: { message: 'boom' } });
    const repo = new SupabaseEnquiryRepository(client);
    await expect(repo.insert(row)).rejects.toThrow();
  });

  it('listNewestFirst orders by created_at desc', async () => {
    const { client, builder } = mockSupabase({ data: [row], error: null });
    const repo = new SupabaseEnquiryRepository(client);
    const list = await repo.listNewestFirst();
    expect(list).toHaveLength(1);
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('listNewestFirst throws on error', async () => {
    const { client } = mockSupabase({ data: null, error: { message: 'down' } });
    await expect(new SupabaseEnquiryRepository(client).listNewestFirst()).rejects.toThrow();
  });

  it('latest returns the newest enquiry without email', async () => {
    const noEmail: Record<string, unknown> = { ...row };
    delete noEmail.email;
    const { client, builder } = mockSupabase({ data: [noEmail], error: null });
    const repo = new SupabaseEnquiryRepository(client);
    const latest = await repo.latest();
    expect(latest).not.toBeNull();
    expect(latest).not.toHaveProperty('email');
    const selectArg = (builder.select as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(selectArg).not.toContain('email');
  });

  it('latest returns null when there are no enquiries', async () => {
    const { client } = mockSupabase({ data: [], error: null });
    expect(await new SupabaseEnquiryRepository(client).latest()).toBeNull();
  });
});
