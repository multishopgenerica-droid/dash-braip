import { z } from 'zod';

export const EmployeeRoleEnum = z.enum([
  'GESTOR_TRAFEGO',
  'COPYWRITER',
  'DESIGNER',
  'SUPORTE',
  'DESENVOLVEDOR',
  'ADMINISTRATIVO',
  'VENDEDOR',
  'GERENTE',
  'OUTROS',
]);

export const EmployeeStatusEnum = z.enum([
  'ATIVO',
  'INATIVO',
  'FERIAS',
  'AFASTADO',
]);

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  phone: z.string().optional().transform(v => v === '' ? undefined : v),
  role: EmployeeRoleEnum,
  status: EmployeeStatusEnum.default('ATIVO'),
  salary: z.number().int().nonnegative('Salário não pode ser negativo'), // in cents
  bonus: z.number().int().nonnegative().default(0), // in cents
  benefits: z.number().int().nonnegative().default(0), // in cents
  document: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  paymentDay: z.number().int().min(1).max(31).default(5),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeFilterSchema = z.object({
  role: EmployeeRoleEnum.optional(),
  status: EmployeeStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEmployeeDTO = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDTO = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFilterDTO = z.infer<typeof employeeFilterSchema>;
