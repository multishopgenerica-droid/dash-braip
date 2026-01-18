import { Router } from 'express';
import { Role } from '@prisma/client';
import * as usersController from './users.controller';
import { authMiddleware, authorize } from '../auth/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.get('/', authorize(Role.ADMIN), usersController.listUsers);
router.post('/', authorize(Role.ADMIN), usersController.createUser);
router.delete('/:id', authorize(Role.ADMIN), usersController.deleteUser);

// Admin or self
router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUser);

export default router;
