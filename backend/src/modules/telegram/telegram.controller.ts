import { Request, Response, NextFunction } from 'express';
import { telegramService } from './telegram.service';

// Webhook from Telegram
export async function handleTelegramWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { webhookSecret } = req.params;
    const update = req.body;

    console.log('Telegram webhook received');
    console.log('Update:', JSON.stringify(update, null, 2));

    const result = await telegramService.processUpdate(webhookSecret, update);

    // Always return 200 to Telegram to acknowledge receipt
    res.status(200).json(result);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Still return 200 to avoid Telegram retrying
    res.status(200).json({ success: false, error: 'Internal error' });
  }
}

// Get Telegram config for current user
export async function getConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await telegramService.getConfig(req.user!.id);

    res.json({
      success: true,
      data: config || {
        enabled: false,
        botToken: null,
        botUsername: null,
        authorizedUsers: null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update Telegram config
export async function updateConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { enabled, botToken, authorizedUsers } = req.body;

    const config = await telegramService.updateConfig(req.user!.id, {
      enabled,
      botToken,
      authorizedUsers,
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
}

// Setup webhook for Telegram bot
export async function setupWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { baseUrl } = req.body;

    if (!baseUrl) {
      res.status(400).json({
        success: false,
        error: 'baseUrl is required',
      });
      return;
    }

    const result = await telegramService.setupWebhook(req.user!.id, baseUrl);

    res.json({
      success: result.success,
      data: result.success ? { webhookUrl: result.webhookUrl } : null,
      error: result.error,
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
    const result = await telegramService.testConnection(req.user!.id);

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
    const history = await telegramService.getChatHistory(req.user!.id, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
