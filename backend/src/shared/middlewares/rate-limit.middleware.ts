import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { GENERAL_MESSAGES } from '../constants/messages';

export const apiLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW, 10) * 60 * 1000,
  max: parseInt(env.RATE_LIMIT_MAX, 10),
  message: {
    success: false,
    error: GENERAL_MESSAGES.RATE_LIMIT,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
