import { Router } from 'express';
import * as analyticsController from './analytics.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/revenue', analyticsController.getRevenue);
router.get('/funnel', analyticsController.getFunnel);
router.get('/comparison', analyticsController.getComparison);
router.get('/realtime', analyticsController.getRealtime);

export default router;
