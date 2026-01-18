import { Router } from 'express';
import * as productsController from './products.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', productsController.listProducts);
router.get('/ranking', productsController.getProductsRanking);
router.get('/top-sellers', productsController.getTopSellers);
router.get('/worst-sellers', productsController.getWorstSellers);
router.get('/:id', productsController.getProductById);
router.get('/:id/metrics', productsController.getProductMetrics);

export default router;
