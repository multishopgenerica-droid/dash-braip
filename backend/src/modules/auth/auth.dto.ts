import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha e obrigatoria'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token e obrigatorio'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual e obrigatoria'),
  newPassword: z.string().min(8, 'Nova senha deve ter no minimo 8 caracteres'),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
