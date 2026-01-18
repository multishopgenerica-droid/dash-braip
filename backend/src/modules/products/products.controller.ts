import { Request, Response, NextFunction } from 'express';
import * as productsService from './products.service';
import { productsQuerySchema } from './products.dto';

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = productsQuerySchema.parse(req.query);
    const result = await productsService.listProducts(req.user!.id, query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await productsService.getProductById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await productsService.getProductMetrics(req.user!.id, req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductsRanking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await productsService.getProductsRanking(req.user!.id, gatewayId, 'best', limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTopSellers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await productsService.getTopSellers(req.user!.id, gatewayId, limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorstSellers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gatewayId = req.query.gatewayId as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await productsService.getWorstSellers(req.user!.id, gatewayId, limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
