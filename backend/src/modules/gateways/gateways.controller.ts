import { Request, Response, NextFunction } from 'express';
import * as gatewaysService from './gateways.service';
import { createGatewaySchema, updateGatewaySchema } from './gateways.dto';
import { GATEWAY_MESSAGES } from '../../shared/constants/messages';
import { syncGateway } from '../sync/sync.service';

export async function listGateways(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gateways = await gatewaysService.listGateways(req.user!.id);

    res.json({
      success: true,
      data: { gateways },
    });
  } catch (error) {
    next(error);
  }
}

export async function getGatewayById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gateway = await gatewaysService.getGatewayById(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: { gateway },
    });
  } catch (error) {
    next(error);
  }
}

export async function createGateway(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createGatewaySchema.parse(req.body);
    const gateway = await gatewaysService.createGateway(req.user!.id, data);

    res.status(201).json({
      success: true,
      data: { gateway },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGateway(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = updateGatewaySchema.parse(req.body);
    const gateway = await gatewaysService.updateGateway(
      req.user!.id,
      req.params.id,
      data
    );

    res.json({
      success: true,
      data: { gateway },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteGateway(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await gatewaysService.deleteGateway(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Gateway removido com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

export async function testConnection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isConnected = await gatewaysService.testGatewayConnection(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: { connected: isConnected },
    });
  } catch (error) {
    next(error);
  }
}

export async function getStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await gatewaysService.getGatewayStatus(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerSync(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gateway = await gatewaysService.getGatewayById(
      req.user!.id,
      req.params.id
    );

    const result = await syncGateway(gateway.id);

    res.json({
      success: true,
      message: GATEWAY_MESSAGES.SYNC_STARTED,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
