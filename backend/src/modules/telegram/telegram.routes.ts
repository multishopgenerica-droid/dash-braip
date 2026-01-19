import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  getConfig,
  updateConfig,
  setupWebhook,
  testConnection,
  getChatHistory,
} from './telegram.controller';

const router = Router();

// Protected routes (require authentication)
router.get('/config', authMiddleware, getConfig);
router.put('/config', authMiddleware, updateConfig);
router.post('/setup-webhook', authMiddleware, setupWebhook);
router.post('/test-connection', authMiddleware, testConnection);
router.get('/history', authMiddleware, getChatHistory);

export default router;
