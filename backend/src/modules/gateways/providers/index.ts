import { GatewayType } from '@prisma/client';
import { PaymentGateway } from './gateway.interface';
import { BraipProvider, BraipProviderOptions } from './braip.provider';

export * from './gateway.interface';
export { BraipProvider, BraipProviderOptions } from './braip.provider';

export interface GatewayProviderOptions {
  apiToken: string;
  proxyUrl?: string;
}

export function createGatewayProvider(
  type: GatewayType,
  options: GatewayProviderOptions | string
): PaymentGateway {
  const config = typeof options === 'string'
    ? { apiToken: options }
    : options;

  switch (type) {
    case 'BRAIP':
      return new BraipProvider(config);
    default:
      throw new Error(`Gateway ${type} not implemented`);
  }
}
