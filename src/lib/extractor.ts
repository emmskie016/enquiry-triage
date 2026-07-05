import type Anthropic from '@anthropic-ai/sdk';
import {
  ExtractionSchema,
  IntentSchema,
  UrgencySchema,
  type EnquiryPayload,
  type Extraction,
} from './schemas';

export interface Extractor {
  extract(payload: EnquiryPayload): Promise<Extraction>;
}

const MODEL = 'claude-haiku-4-5-20251001';

// Tool schema mirrors ExtractionSchema (single source of truth for enums).
const TRIAGE_TOOL: Anthropic.Tool = {
  name: 'triage_enquiry',
  description:
    'Record the structured triage of a real-estate enquiry and a personalised draft reply.',
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: IntentSchema.options,
        description: 'What the enquirer wants.',
      },
      property_address: {
        type: ['string', 'null'],
        description: 'Property address mentioned, or null.',
      },
      budget: {
        type: ['string', 'null'],
        description: "Budget mentioned (e.g. '$650k', '$750/week'), or null.",
      },
      urgency: {
        type: 'string',
        enum: UrgencySchema.options,
        description: 'How urgent the enquiry is.',
      },
      summary: {
        type: 'string',
        description: 'One-sentence summary of the enquiry.',
      },
      draft_reply: {
        type: 'string',
        description:
          'A warm, personalised draft email reply from the agency, signed "The Property Team".',
      },
    },
    required: ['intent', 'property_address', 'budget', 'urgency', 'summary', 'draft_reply'],
  },
};

export class AnthropicExtractor implements Extractor {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string = MODEL
  ) {}

  async extract(payload: EnquiryPayload): Promise<Extraction> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      tools: [TRIAGE_TOOL],
      tool_choice: { type: 'tool', name: 'triage_enquiry' },
      messages: [
        {
          role: 'user',
          content: [
            'Triage this real-estate enquiry and draft a warm, personalised reply.',
            `Name: ${payload.name ?? 'unknown'}`,
            `Source: ${payload.source ?? 'unknown'}`,
            `Message: ${payload.message}`,
          ].join('\n'),
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );
    if (!toolUse) {
      throw new Error('extraction failed: no tool_use block in model response');
    }
    // Any schema violation throws — TriageService applies the fallback.
    return ExtractionSchema.parse(toolUse.input);
  }
}

/**
 * Defined once, used for every extraction failure path (FR-005).
 * The enquiry is never lost: conservative defaults + a generic warm reply.
 */
export function fallbackExtraction(payload: Pick<EnquiryPayload, 'message' | 'name'>): Extraction {
  const firstName = payload.name?.trim().split(/\s+/)[0];
  return {
    intent: 'general',
    urgency: 'medium',
    property_address: null,
    budget: null,
    summary: payload.message.slice(0, 120),
    draft_reply: [
      `Hi${firstName ? ` ${firstName}` : ' there'},`,
      '',
      'Thanks so much for getting in touch — we’ve received your enquiry and one of our agents will get back to you shortly with the details you need.',
      '',
      'Warm regards,',
      'The Property Team',
    ].join('\n'),
  };
}
