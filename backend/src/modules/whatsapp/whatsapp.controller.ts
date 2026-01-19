import { Request, Response, NextFunction } from 'express';
import { whatsAppService } from './whatsapp.service';

// Webhook from Evolution API
export async function handleEvolutionWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { instance } = req.params;
    const payload = req.body;

    console.log(`Evolution webhook received for instance: ${instance}`);
    console.log('Event:', payload.event);

    // Only process message events
    if (payload.event !== 'messages.upsert') {
      res.status(200).json({ success: true, message: 'Event ignored' });
      return;
    }

    const result = await whatsAppService.processIncomingMessage(instance, payload);

    res.status(200).json(result);
  } catch (error) {
    console.error('Evolution webhook error:', error);
    next(error);
  }
}

// Get WhatsApp config for current user
export async function getConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await whatsAppService.getConfig(req.user!.id);

    res.json({
      success: true,
      data: config || {
        enabled: false,
        phoneNumber: null,
        instanceName: null,
        evolutionApiUrl: null,
        authorizedPhones: null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update WhatsApp config
export async function updateConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      enabled,
      phoneNumber,
      instanceName,
      evolutionApiUrl,
      evolutionApiKey,
      authorizedPhones,
    } = req.body;

    const config = await whatsAppService.updateConfig(req.user!.id, {
      enabled,
      phoneNumber,
      instanceName,
      evolutionApiUrl,
      evolutionApiKey,
      authorizedPhones,
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
}

// Test connection
export async function testConnection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await whatsAppService.testConnection(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Get chat history
export async function getChatHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const history = await whatsAppService.getChatHistory(req.user!.id, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
