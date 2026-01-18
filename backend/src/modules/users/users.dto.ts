import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  role: z.nativeEnum(Role).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Email invalido').optional(),
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
