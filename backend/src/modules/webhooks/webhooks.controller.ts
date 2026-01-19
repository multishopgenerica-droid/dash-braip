import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { handleBraipWebhook } from './handlers/braip.handler';

interface WebhookRequest extends Request {
  params: {
    gateway: string;
    webhookToken: string;
  };
}

export async function processWebhook(
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { gateway, webhookToken } = req.params;
  const payload = req.body;

  console.log(`Webhook received for gateway: ${gateway}, token: ${webhookToken}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    // Find gateway config by webhook token
    const gatewayConfig = await prisma.gatewayConfig.findFirst({
      where: {
        webhookToken,
        isActive: true,
      },
    });

    if (!gatewayConfig) {
      console.log(`Gateway not found for webhook token: ${webhookToken}`);
      res.status(404).json({
        success: false,
        message: 'Gateway not found or inactive',
      });
      return;
    }

    // Verify gateway type matches
    if (gatewayConfig.gateway.toLowerCase() !== gateway.toLowerCase()) {
      console.log(`Gateway type mismatch: expected ${gatewayConfig.gateway}, got ${gateway}`);
      res.status(400).json({
        success: false,
        message: 'Gateway type mismatch',
      });
      return;
    }

    // Log webhook receipt
    await prisma.webhookLog.create({
      data: {
        gatewayConfigId: gatewayConfig.id,
        event: payload.event || 'unknown',
        payload: payload,
        status: 'RECEIVED',
      },
    });

    // Process based on gateway type
    let result;
    switch (gateway.toLowerCase()) {
      case 'braip':
        result = await handleBraipWebhook(gatewayConfig.id, payload);
        break;
      default:
        result = { success: false, message: `Unknown gateway: ${gateway}` };
    }

    // Update webhook log status
    await prisma.webhookLog.updateMany({
      where: {
        gatewayConfigId: gatewayConfig.id,
        status: 'RECEIVED',
      },
      data: {
        status: result.success ? 'PROCESSED' : 'FAILED',
        processedAt: new Date(),
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log error
    try {
      const gatewayConfig = await prisma.gatewayConfig.findFirst({
        where: { webhookToken },
      });

      if (gatewayConfig) {
        await prisma.webhookLog.create({
          data: {
            gatewayConfigId: gatewayConfig.id,
            event: payload.event || 'unknown',
            payload: payload,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    next(error);
  }
}

// Health check endpoint for webhook
export function webhookHealth(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
