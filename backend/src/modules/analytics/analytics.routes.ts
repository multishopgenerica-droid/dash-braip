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

// New analytics endpoints
router.get('/affiliates', analyticsController.getAffiliates);
router.get('/sales-by-source', analyticsController.getSalesBySource);
router.get('/products-plans', analyticsController.getProductsPlans);
router.get('/heatmap', analyticsController.getSalesHeatmap);
router.get('/full', analyticsController.getFullDashboard);
router.get('/all-products', analyticsController.getAllProducts);

export default router;
