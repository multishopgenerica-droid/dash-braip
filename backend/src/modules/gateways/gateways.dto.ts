import { z } from 'zod';
import { GatewayType } from '@prisma/client';

export const createGatewaySchema = z.object({
  gateway: z.nativeEnum(GatewayType),
  apiToken: z.string().min(1, 'Token de API e obrigatorio'),
});

export const updateGatewaySchema = z.object({
  apiToken: z.string().min(1, 'Token de API e obrigatorio').optional(),
  isActive: z.boolean().optional(),
});

export type CreateGatewayDTO = z.infer<typeof createGatewaySchema>;
export type UpdateGatewayDTO = z.infer<typeof updateGatewaySchema>;
