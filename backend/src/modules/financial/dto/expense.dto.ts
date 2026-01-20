import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'MARKETING',
  'OPERACIONAL',
  'TECNOLOGIA',
  'RECURSOS_HUMANOS',
  'TRAFEGO',
  'INFRAESTRUTURA',
  'OUTROS',
]);

export const ExpenseStatusEnum = z.enum([
  'PENDENTE',
  'PAGO',
  'CANCELADO',
  'VENCIDO',
]);

export const RecurrenceTypeEnum = z.enum([
  'UNICO',
  'DIARIO',
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
]);

export const createExpenseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().optional(),
  category: ExpenseCategoryEnum,
  status: ExpenseStatusEnum.default('PENDENTE'),
  amount: z.number().int().positive('Valor deve ser positivo'), // in cents
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  recurrence: RecurrenceTypeEnum.default('UNICO'),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseFilterSchema = z.object({
  category: ExpenseCategoryEnum.optional(),
  status: ExpenseStatusEnum.optional(),
  recurrence: RecurrenceTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterDTO = z.infer<typeof expenseFilterSchema>;
