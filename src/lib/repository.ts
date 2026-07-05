import type { SupabaseClient } from '@supabase/supabase-js';
import type { Enquiry, LatestEnquiry } from './schemas';

export type NewEnquiry = Omit<Enquiry, 'id' | 'created_at'>;

export interface EnquiryRepository {
  insert(enquiry: NewEnquiry): Promise<Enquiry>;
  listNewestFirst(): Promise<Enquiry[]>;
  latest(): Promise<LatestEnquiry | null>;
}

const TABLE = 'enquiries';
// Voice-agent projection — email deliberately excluded (FR-010).
const LATEST_COLUMNS = 'name, intent, property_address, budget, urgency, summary, created_at';

export class SupabaseEnquiryRepository implements EnquiryRepository {
  constructor(private readonly client: SupabaseClient) {}

  async insert(enquiry: NewEnquiry): Promise<Enquiry> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert(enquiry)
      .select()
      .single();
    if (error) throw new Error(`insert failed: ${error.message}`);
    return data as Enquiry;
  }

  async listNewestFirst(): Promise<Enquiry[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`list failed: ${error.message}`);
    return (data ?? []) as Enquiry[];
  }

  async latest(): Promise<LatestEnquiry | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(LATEST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw new Error(`latest failed: ${error.message}`);
    if (!data || data.length === 0) return null;
    return data[0] as unknown as LatestEnquiry;
  }
}
