import { z } from 'zod';

export const modelRequestSchema = z.object({
  modelName: z.string().trim().min(2).max(120),
  provider: z.string().trim().min(2).max(120),
  website: z.string().url().optional().or(z.literal('')),
  modality: z.enum([
    'llm',
    'image',
    'audio',
    'video',
    'embedding',
    'code',
    'speech-to-text',
    'text-to-speech',
    'multimodal',
  ]),
  hostingRegion: z.enum(['ru', 'eu', 'us', 'global']).optional(),
  useCase: z.string().trim().min(10).max(1200),
  contactEmail: z.string().trim().email(),
  contactName: z.string().trim().min(2).max(120).optional(),
});

export type ModelRequestPayload = z.infer<typeof modelRequestSchema>;
