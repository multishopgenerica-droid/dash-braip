import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { verifyAccessToken } from '../../config/jwt';
import { AppError } from '../../shared/middlewares/error.middleware';
import { AUTH_MESSAGES } from '../../shared/constants/messages';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, AUTH_MESSAGES.TOKEN_NOT_PROVIDED);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError(401, AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new AppError(401, AUTH_MESSAGES.USER_INACTIVE);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, AUTH_MESSAGES.TOKEN_INVALID));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, AUTH_MESSAGES.UNAUTHORIZED));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, AUTH_MESSAGES.FORBIDDEN));
      return;
    }

    next();
  };
}
