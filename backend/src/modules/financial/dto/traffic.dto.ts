import { z } from 'zod';

export const TrafficPlatformEnum = z.enum([
  'META_ADS',
  'GOOGLE_ADS',
  'TIKTOK_ADS',
  'YOUTUBE_ADS',
  'NATIVE_ADS',
  'PINTEREST_ADS',
  'LINKEDIN_ADS',
  'TWITTER_ADS',
  'OUTROS',
]);

export const createTrafficSpendSchema = z.object({
  platform: TrafficPlatformEnum,
  campaignName: z.string().max(255).optional(),
  date: z.string().datetime(),
  spend: z.number().int().nonnegative('Gasto não pode ser negativo'), // in cents
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  revenue: z.number().int().nonnegative().default(0), // in cents
  notes: z.string().optional(),
});

export const updateTrafficSpendSchema = createTrafficSpendSchema.partial();

export const trafficFilterSchema = z.object({
  platform: TrafficPlatformEnum.optional(),
  campaignName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTrafficSpendDTO = z.infer<typeof createTrafficSpendSchema>;
export type UpdateTrafficSpendDTO = z.infer<typeof updateTrafficSpendSchema>;
export type TrafficFilterDTO = z.infer<typeof trafficFilterSchema>;
