import axios from 'axios';
import { prisma } from '../../config/database';
import { aiQueryService } from '../whatsapp/ai-query.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
    };
    date: number;
    text?: string;
  };
}

interface ProcessResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class TelegramService {
  private getApiUrl(botToken: string): string {
    return `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(botToken: string, chatId: string | number, text: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.getApiUrl(botToken)}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      });

      console.log(`Telegram message sent to ${chatId}:`, response.data.ok);
      return response.data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.getApiUrl(botToken)}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message'],
      });

      console.log('Webhook set:', response.data);
      return response.data.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  async deleteWebhook(botToken: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.getApiUrl(botToken)}/deleteWebhook`);
      return response.data.ok;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }

  async getMe(botToken: string): Promise<{ ok: boolean; username?: string; first_name?: string }> {
    try {
      const response = await axios.get(`${this.getApiUrl(botToken)}/getMe`);
      if (response.data.ok) {
        return {
          ok: true,
          username: response.data.result.username,
          first_name: response.data.result.first_name,
        };
      }
      return { ok: false };
    } catch (error) {
      console.error('Error getting bot info:', error);
      return { ok: false };
    }
  }

  async processUpdate(
    webhookSecret: string,
    update: TelegramUpdate
  ): Promise<ProcessResult> {
    try {
      // Only process text messages
      if (!update.message?.text) {
        return { success: true, message: 'No text message' };
      }

      const { message } = update;
      const chatId = message.chat.id.toString();
      const userId = message.from.id.toString();
      const username = message.from.username || null;
      const firstName = message.from.first_name;
      const text = message.text!; // Already checked above that text exists

      console.log(`Telegram message from ${firstName} (@${username}): ${text}`);

      // Find config by webhook secret
      const config = await prisma.telegramConfig.findFirst({
        where: {
          webhookSecret,
          enabled: true,
        },
      });

      if (!config) {
        console.log('No active Telegram config found for webhook secret');
        return { success: false, error: 'Bot not configured' };
      }

      // Check if user is authorized
      if (!this.isAuthorized(userId, config.authorizedUsers)) {
        console.log(`User ${userId} is not authorized`);

        // Send unauthorized message
        await this.sendMessage(
          config.botToken!,
          chatId,
          '⛔ Você não está autorizado a usar este bot.\n\nSeu ID: `' + userId + '`\n\nPeça ao administrador para adicionar seu ID.'
        );

        return { success: false, error: 'User not authorized' };
      }

      // Handle /start command
      if (text === '/start') {
        await this.sendMessage(
          config.botToken!,
          chatId,
          `🤖 *Olá ${firstName}!*\n\nSou o assistente do Dashboard Braip.\n\nVocê pode me perguntar:\n• Quanto faturei hoje?\n• Resumo de vendas\n• Top produtos\n• Comparativo com ontem\n\nDigite sua pergunta!`
        );
        return { success: true, message: 'Start command sent' };
      }

      // Handle /help command
      if (text === '/help') {
        await this.sendMessage(
          config.botToken!,
          chatId,
          `📊 *Comandos disponíveis:*\n\n• "faturamento hoje" - Faturamento do dia\n• "faturamento ontem" - Faturamento de ontem\n• "resumo vendas" - Resumo geral\n• "top produtos" - Produtos mais vendidos\n• "comparativo" - Comparação com período anterior\n\nOu pergunte naturalmente!`
        );
        return { success: true, message: 'Help sent' };
      }

      // Process the query
      const configUserId = config.userId;
      const queryResult = await aiQueryService.processQuery(configUserId, text);

      // Log the chat
      await prisma.telegramChatLog.create({
        data: {
          telegramConfigId: config.id,
          chatId,
          userId,
          username: username || undefined,
          firstName: firstName || '',
          messageIn: text,
          messageOut: queryResult.response || null,
          intent: queryResult.intent || null,
          queryData: queryResult.data as never,
          processedAt: new Date(),
        },
      });

      // Send response
      const sent = await this.sendMessage(config.botToken!, chatId, queryResult.response);

      if (!sent) {
        return { success: false, error: 'Failed to send response' };
      }

      return { success: true, message: 'Response sent' };
    } catch (error) {
      console.error('Error processing Telegram update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private isAuthorized(userId: string, authorizedUsers: string | null): boolean {
    // If no authorized users configured, allow all
    if (!authorizedUsers || authorizedUsers.trim() === '') {
      return true;
    }

    const authorized = authorizedUsers
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    return authorized.includes(userId);
  }

  // Dashboard API methods
  async getConfig(userId: string) {
    return prisma.telegramConfig.findUnique({
      where: { userId },
    });
  }

  async updateConfig(
    userId: string,
    data: {
      enabled?: boolean;
      botToken?: string;
      authorizedUsers?: string;
    }
  ) {
    // If botToken is provided, get bot username
    let botUsername: string | undefined;
    if (data.botToken) {
      const botInfo = await this.getMe(data.botToken);
      if (botInfo.ok) {
        botUsername = botInfo.username;
      }
    }

    return prisma.telegramConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
        botUsername,
      },
      update: {
        ...data,
        ...(botUsername && { botUsername }),
      },
    });
  }

  async setupWebhook(userId: string, baseUrl: string): Promise<{ success: boolean; webhookUrl?: string; error?: string }> {
    const config = await this.getConfig(userId);

    if (!config || !config.botToken) {
      return { success: false, error: 'Bot token not configured' };
    }

    const webhookUrl = `${baseUrl}/webhooks/telegram/${config.webhookSecret}`;
    const success = await this.setWebhook(config.botToken, webhookUrl);

    if (success) {
      return { success: true, webhookUrl };
    }

    return { success: false, error: 'Failed to set webhook' };
  }

  async testConnection(userId: string): Promise<{ connected: boolean; username?: string }> {
    const config = await this.getConfig(userId);

    if (!config || !config.botToken) {
      return { connected: false };
    }

    const botInfo = await this.getMe(config.botToken);
    return {
      connected: botInfo.ok,
      username: botInfo.username,
    };
  }

  async getChatHistory(userId: string, limit: number = 50) {
    const config = await this.getConfig(userId);

    if (!config) {
      return [];
    }

    return prisma.telegramChatLog.findMany({
      where: { telegramConfigId: config.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const telegramService = new TelegramService();
