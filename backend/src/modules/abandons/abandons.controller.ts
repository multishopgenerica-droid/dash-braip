import { Request, Response, NextFunction } from 'express';
import * as abandonsService from './abandons.service';
import { abandonsQuerySchema } from './abandons.dto';

export async function listAbandons(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = abandonsQuerySchema.parse(req.query);
    const result = await abandonsService.listAbandons(req.user!.id, query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAbandonById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const abandon = await abandonsService.getAbandonById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: { abandon },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAbandonsStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const stats = await abandonsService.getAbandonsStats(req.user!.id, gatewayId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAbandonsByProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await abandonsService.getAbandonsByProduct(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAbandonsByPeriod(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const period = (req.query.period as string) || 'last30days';
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await abandonsService.getAbandonsByPeriod(req.user!.id, period, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
