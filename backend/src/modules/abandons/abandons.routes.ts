import { Router } from 'express';
import * as abandonsController from './abandons.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', abandonsController.listAbandons);
router.get('/stats', abandonsController.getAbandonsStats);
router.get('/by-product', abandonsController.getAbandonsByProduct);
router.get('/by-period', abandonsController.getAbandonsByPeriod);
router.get('/:id', abandonsController.getAbandonById);

export default router;
