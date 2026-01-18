import { z } from 'zod';
import { AiAnalysisType } from '@prisma/client';

export const createAiAnalysisSchema = z.object({
  title: z.string().min(1, 'Titulo e obrigatorio'),
  description: z.string().optional(),
  type: z.nativeEnum(AiAnalysisType),
  prompt: z.string().min(1, 'Prompt e obrigatorio'),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAiAnalysisSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  prompt: z.string().min(1).optional(),
  result: z.string().optional(),
});

export const aiAnalysisQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});

export type CreateAiAnalysisDTO = z.infer<typeof createAiAnalysisSchema>;
export type UpdateAiAnalysisDTO = z.infer<typeof updateAiAnalysisSchema>;
export type AiAnalysisQueryDTO = z.infer<typeof aiAnalysisQuerySchema>;
