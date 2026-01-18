import { Router } from 'express';
import * as salesController from './sales.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', salesController.listSales);
router.get('/stats', salesController.getSalesStats);
router.get('/by-status', salesController.getSalesByStatus);
router.get('/by-product', salesController.getSalesByProduct);
router.get('/by-period', salesController.getSalesByPeriod);
router.get('/recent', salesController.getRecentSales);
router.get('/:id', salesController.getSaleById);

export default router;
