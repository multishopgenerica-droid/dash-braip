import { Router } from 'express';
import * as gatewaysController from './gateways.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', gatewaysController.listGateways);
router.get('/:id', gatewaysController.getGatewayById);
router.post('/', gatewaysController.createGateway);
router.put('/:id', gatewaysController.updateGateway);
router.delete('/:id', gatewaysController.deleteGateway);
router.post('/:id/test', gatewaysController.testConnection);
router.get('/:id/status', gatewaysController.getStatus);
router.post('/:id/sync', gatewaysController.triggerSync);

export default router;
