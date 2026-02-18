import { z } from 'zod';
import { RecurrenceTypeEnum } from './expense.dto';

export const ToolCategoryEnum = z.enum([
  'AUTOMACAO',
  'EMAIL_MARKETING',
  'CRM',
  'DESIGN',
  'VIDEO',
  'HOSPEDAGEM',
  'ANALYTICS',
  'COMUNICACAO',
  'GESTAO_PROJETOS',
  'PAGAMENTOS',
  'OUTROS',
]);

export const createToolSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional(),
  category: ToolCategoryEnum,
  monthlyCost: z.number().int().nonnegative('Custo não pode ser negativo'), // in cents
  annualCost: z.number().int().nonnegative().optional(), // in cents
  recurrence: RecurrenceTypeEnum.default('MENSAL'),
  billingDate: z.string().datetime().optional(), // Next billing date
  isActive: z.boolean().default(true),
  loginUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const updateToolSchema = createToolSchema.partial();

export const toolFilterSchema = z.object({
  category: ToolCategoryEnum.optional(),
  isActive: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateToolDTO = z.infer<typeof createToolSchema>;
export type UpdateToolDTO = z.infer<typeof updateToolSchema>;
export type ToolFilterDTO = z.infer<typeof toolFilterSchema>;
