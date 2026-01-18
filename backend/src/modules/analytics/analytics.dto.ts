import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  gatewayId: z.string().optional(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AnalyticsQueryDTO = z.infer<typeof analyticsQuerySchema>;
