import { Router } from 'express';
import * as authController from './auth.controller';
import { authMiddleware, authorize } from './auth.middleware';
import { authLimiter } from '../../shared/middlewares/rate-limit.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.post('/register', authorize(Role.ADMIN), authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.patch('/password', authMiddleware, authController.changePassword);
router.get('/me', authMiddleware, authController.getMe);

export default router;
