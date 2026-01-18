import { GatewayConfig, SyncStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { encrypt, decrypt } from '../../shared/utils/crypto';
import { AppError } from '../../shared/middlewares/error.middleware';
import { GATEWAY_MESSAGES } from '../../shared/constants/messages';
import { createGatewayProvider } from './providers';
import { CreateGatewayDTO, UpdateGatewayDTO } from './gateways.dto';

type GatewayWithoutToken = Omit<GatewayConfig, 'apiToken'>;

function excludeToken(gateway: GatewayConfig): GatewayWithoutToken {
  const { apiToken: _, ...gatewayWithoutToken } = gateway;
  return gatewayWithoutToken;
}

export async function listGateways(userId: string): Promise<GatewayWithoutToken[]> {
  const gateways = await prisma.gatewayConfig.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return gateways.map(excludeToken);
}

export async function getGatewayById(
  userId: string,
  gatewayId: string
): Promise<GatewayWithoutToken> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: { id: gatewayId, userId },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  return excludeToken(gateway);
}

export async function createGateway(
  userId: string,
  data: CreateGatewayDTO
): Promise<GatewayWithoutToken> {
  const existingGateway = await prisma.gatewayConfig.findUnique({
    where: {
      userId_gateway: {
        userId,
        gateway: data.gateway,
      },
    },
  });

  if (existingGateway) {
    throw new AppError(400, GATEWAY_MESSAGES.ALREADY_EXISTS);
  }

  // Skip connection test - Cloudflare blocks datacenter IPs
  // TODO: Implement webhook-based validation or request IP whitelist from Braip
  console.log(`Creating gateway ${data.gateway} - skipping connection test due to Cloudflare restrictions`);

  const encryptedToken = encrypt(data.apiToken);

  const gateway = await prisma.gatewayConfig.create({
    data: {
      userId,
      gateway: data.gateway,
      apiToken: encryptedToken,
    },
  });

  return excludeToken(gateway);
}

export async function updateGateway(
  userId: string,
  gatewayId: string,
  data: UpdateGatewayDTO
): Promise<GatewayWithoutToken> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: { id: gatewayId, userId },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  const updateData: Partial<GatewayConfig> = {};

  if (data.apiToken) {
    // Test new token before saving
    const provider = createGatewayProvider(gateway.gateway, data.apiToken);
    const isValid = await provider.testConnection();

    if (!isValid) {
      throw new AppError(400, GATEWAY_MESSAGES.INVALID_TOKEN);
    }

    updateData.apiToken = encrypt(data.apiToken);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  const updatedGateway = await prisma.gatewayConfig.update({
    where: { id: gatewayId },
    data: updateData,
  });

  return excludeToken(updatedGateway);
}

export async function deleteGateway(userId: string, gatewayId: string): Promise<void> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: { id: gatewayId, userId },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  await prisma.gatewayConfig.delete({
    where: { id: gatewayId },
  });
}

export async function testGatewayConnection(
  userId: string,
  gatewayId: string
): Promise<boolean> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: { id: gatewayId, userId },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  const decryptedToken = decrypt(gateway.apiToken);
  const provider = createGatewayProvider(gateway.gateway, decryptedToken);

  return provider.testConnection();
}

export async function getGatewayStatus(
  userId: string,
  gatewayId: string
): Promise<{ syncStatus: SyncStatus; lastSync: Date | null }> {
  const gateway = await prisma.gatewayConfig.findFirst({
    where: { id: gatewayId, userId },
    select: { syncStatus: true, lastSync: true },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  return gateway;
}

export async function getGatewayWithToken(gatewayId: string): Promise<{
  gateway: GatewayConfig;
  decryptedToken: string;
}> {
  const gateway = await prisma.gatewayConfig.findUnique({
    where: { id: gatewayId },
  });

  if (!gateway) {
    throw new AppError(404, GATEWAY_MESSAGES.NOT_FOUND);
  }

  const decryptedToken = decrypt(gateway.apiToken);

  return { gateway, decryptedToken };
}
