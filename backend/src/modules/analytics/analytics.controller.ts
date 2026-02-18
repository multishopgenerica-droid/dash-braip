import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const productKey = req.query.productKey as string | undefined;
    const data = await analyticsService.getDashboardMetrics(req.user!.id, gatewayId, { startDate, endDate, productKey });

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

export async function getAffiliates(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = req.query.search as string | undefined;
    const data = await analyticsService.getAffiliateStats(req.user!.id, gatewayId, { startDate, endDate, page, limit, search });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesBySource(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const data = await analyticsService.getSalesBySource(req.user!.id, gatewayId, { startDate, endDate });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductsPlans(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getProductsWithPlans(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFullDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getFullDashboard(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesHeatmap(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const data = await analyticsService.getSalesHeatmap(req.user!.id, gatewayId, { startDate, endDate });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const data = await analyticsService.getAllProducts(req.user!.id, gatewayId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
