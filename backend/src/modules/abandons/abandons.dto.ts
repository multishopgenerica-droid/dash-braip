import { z } from 'zod';

export const abandonsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productKey: z.string().optional(),
  search: z.string().optional(),
  gatewayId: z.string().optional(),
});

export type AbandonsQueryDTO = z.infer<typeof abandonsQuerySchema>;
