import { prisma } from '../../config/database';
import { evolutionService } from './evolution.service';
import { aiQueryService } from './ai-query.service';

interface WhatsAppMessage {
  phone: string;
  message: string;
  messageId: string;
  senderName: string;
  isGroup: boolean;
  groupJid?: string;
}

interface ProcessResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class WhatsAppService {
  async processIncomingMessage(
    instanceName: string,
    payload: Record<string, unknown>
  ): Promise<ProcessResult> {
    try {
      // Parse the incoming message
      const parsed = evolutionService.parseIncomingMessage(payload as never);

      if (!parsed) {
        console.log('Message ignored (not a valid user message)');
        return { success: true, message: 'Message ignored' };
      }

      const { phone, message, messageId, senderName, isGroup, groupJid } = parsed;
      console.log(`Received message from ${phone} (${senderName})${isGroup ? ` in group ${groupJid}` : ''}: ${message}`);

      // Find WhatsApp config by instance name
      const config = await prisma.whatsAppConfig.findFirst({
        where: {
          instanceName,
          enabled: true,
        },
      });

      if (!config) {
        console.log(`No active WhatsApp config found for instance: ${instanceName}`);
        return { success: false, error: 'Instance not configured' };
      }

      // Check if phone is authorized
      if (!this.isAuthorized(phone, config.authorizedPhones)) {
        console.log(`Phone ${phone} is not authorized for instance ${instanceName}`);
        return { success: false, error: 'Phone not authorized' };
      }

      // Get user ID from config
      const userId = config.userId;

      // Process the query
      const queryResult = await aiQueryService.processQuery(userId, message);

      // Log the chat
      const chatLog = await prisma.whatsAppChatLog.create({
        data: {
          whatsappConfigId: config.id,
          phoneNumber: phone,
          messageIn: message,
          messageOut: queryResult.response,
          intent: queryResult.intent,
          queryData: queryResult.data as never,
          processedAt: new Date(),
        },
      });

      // Send response via Evolution API
      let sent = false;

      if (isGroup) {
        // Try sending to group first
        console.log(`Attempting to send to group: ${groupJid}`);
        sent = await evolutionService.sendTextMessage({
          instanceName: config.instanceName!,
          apiUrl: config.evolutionApiUrl!,
          apiKey: config.evolutionApiKey!,
          phone: groupJid!,
          message: queryResult.response,
          isGroup: true,
        });

        // If group send fails and we have a fallback phone number, try direct message
        if (!sent && config.phoneNumber) {
          console.log(`Group send failed, falling back to direct message to: ${config.phoneNumber}`);
          sent = await evolutionService.sendTextMessage({
            instanceName: config.instanceName!,
            apiUrl: config.evolutionApiUrl!,
            apiKey: config.evolutionApiKey!,
            phone: config.phoneNumber,
            message: `📱 *Resposta do grupo ${groupJid?.split('@')[0]}*\n\n${queryResult.response}`,
            isGroup: false,
          });
        }
      } else {
        // Direct message
        sent = await evolutionService.sendTextMessage({
          instanceName: config.instanceName!,
          apiUrl: config.evolutionApiUrl!,
          apiKey: config.evolutionApiKey!,
          phone,
          message: queryResult.response,
          isGroup: false,
        });
      }

      if (!sent) {
        console.error('Failed to send WhatsApp response');
        return { success: false, error: 'Failed to send response' };
      }

      return {
        success: true,
        message: `Response sent to ${phone}`,
      };
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private isAuthorized(phone: string, authorizedPhones: string | null): boolean {
    // If no authorized phones configured, allow all
    if (!authorizedPhones || authorizedPhones.trim() === '') {
      return true;
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check if phone is in the authorized list
    const authorized = authorizedPhones
      .split(',')
      .map((p) => p.trim().replace(/\D/g, ''))
      .filter((p) => p.length > 0);

    return authorized.some((auth) => normalizedPhone.endsWith(auth) || auth.endsWith(normalizedPhone));
  }

  async getConfig(userId: string) {
    return prisma.whatsAppConfig.findUnique({
      where: { userId },
    });
  }

  async updateConfig(
    userId: string,
    data: {
      enabled?: boolean;
      phoneNumber?: string;
      instanceName?: string;
      evolutionApiUrl?: string;
      evolutionApiKey?: string;
      authorizedPhones?: string;
    }
  ) {
    return prisma.whatsAppConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }

  async testConnection(userId: string): Promise<{ connected: boolean; state: string }> {
    const config = await this.getConfig(userId);

    if (!config || !config.instanceName || !config.evolutionApiUrl || !config.evolutionApiKey) {
      return { connected: false, state: 'not_configured' };
    }

    return evolutionService.checkInstanceStatus(
      config.instanceName,
      config.evolutionApiUrl,
      config.evolutionApiKey
    );
  }

  async getChatHistory(userId: string, limit: number = 50) {
    const config = await this.getConfig(userId);

    if (!config) {
      return [];
    }

    return prisma.whatsAppChatLog.findMany({
      where: { whatsappConfigId: config.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const whatsAppService = new WhatsAppService();
