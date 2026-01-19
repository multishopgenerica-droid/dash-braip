import axios, { AxiosInstance } from 'axios';

interface SendMessageOptions {
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  phone: string;
  message: string;
  isGroup?: boolean;
}

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string; // For group messages, this is the sender's JID
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName: string;
}

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: EvolutionMessage | Record<string, unknown>;
  destination?: string;
  date_time?: string;
  sender?: string;
  server_url?: string;
  apikey?: string;
}

export class EvolutionService {
  private createClient(apiUrl: string, apiKey: string): AxiosInstance {
    return axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      timeout: 30000,
    });
  }

  async sendTextMessage(options: SendMessageOptions): Promise<boolean> {
    const { instanceName, apiUrl, apiKey, phone, message, isGroup } = options;

    try {
      const client = this.createClient(apiUrl, apiKey);

      let payload: { number?: string; text: string };

      if (isGroup) {
        // For groups, phone is already the group JID (e.g., 123456789@g.us)
        payload = {
          number: phone,
          text: message,
        };
        console.log(`Sending message to group ${phone}`);
      } else {
        // For direct messages, format the phone number
        const formattedPhone = this.formatPhoneNumber(phone);
        payload = {
          number: formattedPhone,
          text: message,
        };
        console.log(`Sending message to ${formattedPhone}`);
      }

      const response = await client.post(`/message/sendText/${instanceName}`, payload);

      console.log(`Message sent:`, response.data);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        console.error('Error sending WhatsApp message - Status:', axiosError.response?.status);
        console.error('Error response data:', JSON.stringify(axiosError.response?.data, null, 2));
      } else {
        console.error('Error sending WhatsApp message:', error);
      }
      return false;
    }
  }

  parseIncomingMessage(payload: EvolutionWebhookPayload): {
    phone: string;
    message: string;
    messageId: string;
    senderName: string;
    isGroup: boolean;
    groupJid?: string;
  } | null {
    console.log('Parsing Evolution message, event:', payload.event);
    console.log('Payload data:', JSON.stringify(payload.data, null, 2));

    if (payload.event !== 'messages.upsert') {
      console.log('Event is not messages.upsert, ignoring');
      return null;
    }

    const data = payload.data as EvolutionMessage;

    // Ignore messages from self
    if (data.key?.fromMe) {
      console.log('Message is from self (fromMe=true), ignoring');
      return null;
    }

    const remoteJid = data.key?.remoteJid || '';
    const isGroup = remoteJid.endsWith('@g.us');

    // For groups, get the sender from participant; for DMs, get from remoteJid
    let phone: string;
    let groupJid: string | undefined;

    if (isGroup) {
      // Group message - remoteJid is the group, participant is the sender
      groupJid = remoteJid;
      const participant = data.key?.participant || '';
      phone = participant.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');
      console.log(`Group message from ${phone} in group ${groupJid}`);
    } else {
      // Direct message
      phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');
      console.log(`Direct message from ${phone}`);
    }

    // Extract message text - check multiple possible locations
    let message =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      '';

    // Also check if message is in a different structure (Evolution API v2)
    if (!message && data.message) {
      const msgKeys = Object.keys(data.message);
      console.log('Message object keys:', msgKeys);
      // Try to get text from any text-based message type
      for (const key of msgKeys) {
        const msgPart = (data.message as Record<string, unknown>)[key];
        if (typeof msgPart === 'object' && msgPart !== null) {
          const textContent = (msgPart as Record<string, unknown>).text ||
                             (msgPart as Record<string, unknown>).caption;
          if (typeof textContent === 'string') {
            message = textContent;
            console.log(`Found message in ${key}:`, message);
            break;
          }
        }
      }
    }

    if (!message) {
      console.log('No message text found, ignoring');
      return null;
    }

    console.log('Parsed message successfully:', { phone, message: message.trim(), isGroup, groupJid });
    return {
      phone,
      message: message.trim(),
      messageId: data.key?.id || '',
      senderName: data.pushName || '',
      isGroup,
      groupJid,
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let formatted = phone.replace(/\D/g, '');

    // Ensure it starts with country code (Brazil = 55)
    if (!formatted.startsWith('55') && formatted.length <= 11) {
      formatted = '55' + formatted;
    }

    return formatted;
  }

  async checkInstanceStatus(
    instanceName: string,
    apiUrl: string,
    apiKey: string
  ): Promise<{ connected: boolean; state: string }> {
    try {
      const client = this.createClient(apiUrl, apiKey);
      const response = await client.get(`/instance/connectionState/${instanceName}`);

      return {
        connected: response.data?.state === 'open',
        state: response.data?.state || 'unknown',
      };
    } catch (error) {
      console.error('Error checking instance status:', error);
      return { connected: false, state: 'error' };
    }
  }
}

export const evolutionService = new EvolutionService();
