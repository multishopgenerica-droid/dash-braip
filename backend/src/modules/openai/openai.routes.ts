import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import {
  getConfig,
  updateConfig,
  testConnection,
  analyzeData,
  getUsageStats,
  getAvailableModels,
} from './openai.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Config routes
router.get('/config', getConfig);
router.put('/config', updateConfig);

// Test connection
router.post('/test-connection', testConnection);

// Analyze data
router.post('/analyze', analyzeData);

// Usage stats
router.get('/usage', getUsageStats);

// Available models
router.get('/models', getAvailableModels);

export default router;
