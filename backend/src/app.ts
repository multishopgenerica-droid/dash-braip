import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './shared/middlewares/cors.middleware';
import { apiLimiter } from './shared/middlewares/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware';

// Routes
import { authRoutes } from './modules/auth';
import { usersRoutes } from './modules/users';
import { gatewaysRoutes } from './modules/gateways';
import { salesRoutes } from './modules/sales';
import { abandonsRoutes } from './modules/abandons';
import { productsRoutes } from './modules/products';
import { analyticsRoutes } from './modules/analytics';
import { aiAnalysisRoutes } from './modules/ai-analysis';
import { webhookRoutes } from './modules/webhooks';
import { whatsAppRoutes } from './modules/whatsapp';
import { telegramRoutes } from './modules/telegram';
import { openAIRoutes } from './modules/openai';
import { financialRoutes } from './modules/financial';

const app = express();

// Trust proxy (required behind Traefik/nginx)
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet());
app.use(corsMiddleware);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook routes (public, no rate limiting)
app.use('/webhooks', webhookRoutes);

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/gateways', gatewaysRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/abandons', abandonsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/whatsapp', whatsAppRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/openai', openAIRoutes);
app.use('/api/financial', financialRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
