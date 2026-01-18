import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.dto';
import { AUTH_MESSAGES } from '../../shared/constants/messages';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user!.id, refreshToken);

    res.json({
      success: true,
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, data);

    res.json({
      success: true,
      message: AUTH_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
