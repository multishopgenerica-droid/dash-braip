import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../../config/env';
import { GENERAL_MESSAGES } from '../constants/messages';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    const errors = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Dados invalidos',
      details: errors,
    });
    return;
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token invalido ou expirado',
    });
    return;
  }

  const dbErrorCodes = ['P1001', 'P1002', 'P1003', 'P1008', 'P1017'];
  const isDbError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes('ECONNREFUSED') ||
    (error as any).code && dbErrorCodes.includes((error as any).code);

  if (isDbError) {
    res.status(503).json({
      success: false,
      error: 'Servico temporariamente indisponivel. Banco de dados inacessivel.',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: GENERAL_MESSAGES.INTERNAL_ERROR,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: GENERAL_MESSAGES.NOT_FOUND,
  });
}
