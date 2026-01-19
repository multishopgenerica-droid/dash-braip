import { Router } from 'express';
import { processWebhook, webhookHealth } from './webhooks.controller';
import { handleEvolutionWebhook } from '../whatsapp';
import { handleTelegramWebhook } from '../telegram';

const router = Router();

// Health check
router.get('/health', webhookHealth);

// Evolution API webhook - for WhatsApp messages
// URL format: /webhooks/evolution/:instance
// Example: /webhooks/evolution/my-instance
router.post('/evolution/:instance', handleEvolutionWebhook);

// Telegram webhook - for Telegram bot messages
// URL format: /webhooks/telegram/:webhookSecret
// Example: /webhooks/telegram/abc123-secret
router.post('/telegram/:webhookSecret', handleTelegramWebhook);

// Webhook endpoint - public, no auth required
// URL format: /webhooks/:gateway/:webhookToken
// Example: /webhooks/braip/abc123-webhook-token
router.post('/:gateway/:webhookToken', processWebhook);

export default router;
