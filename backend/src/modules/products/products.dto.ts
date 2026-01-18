import { z } from 'zod';

export const productsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  gatewayId: z.string().optional(),
});

export type ProductsQueryDTO = z.infer<typeof productsQuerySchema>;
