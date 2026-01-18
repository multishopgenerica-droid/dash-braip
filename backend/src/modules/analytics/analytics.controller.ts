import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getDashboardMetrics(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevenue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const period = (req.query.period as string) || 'last30days';
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getRevenueByPeriod(req.user!.id, period, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFunnel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getConversionFunnel(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getComparison(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getComparison(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRealtime(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getRealtimeMetrics(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
