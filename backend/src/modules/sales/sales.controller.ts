import { Request, Response, NextFunction } from 'express';
import * as salesService from './sales.service';
import { salesQuerySchema } from './sales.dto';

export async function listSales(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = salesQuerySchema.parse(req.query);
    const result = await salesService.listSales(req.user!.id, query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSaleById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sale = await salesService.getSaleById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: { sale },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const stats = await salesService.getSalesStats(req.user!.id, gatewayId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesByStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const productKey = req.query.productKey as string | undefined;
    const data = await salesService.getSalesByStatus(req.user!.id, { gatewayId, startDate, endDate, productKey });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesByProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const data = await salesService.getSalesByProduct(req.user!.id, { gatewayId, startDate, endDate });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesByPeriod(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const period = (req.query.period as string) || 'last30days';
    const gatewayId = req.query.gatewayId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const productKey = req.query.productKey as string | undefined;
    const data = await salesService.getSalesByPeriod(req.user!.id, { period, gatewayId, startDate, endDate, productKey });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRecentSales(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const gatewayId = req.query.gatewayId as string | undefined;
    const sales = await salesService.getRecentSales(req.user!.id, limit, gatewayId);

    res.json({
      success: true,
      data: { sales },
    });
  } catch (error) {
    next(error);
  }
}
