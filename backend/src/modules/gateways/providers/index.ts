import { GatewayType } from '@prisma/client';
import { PaymentGateway } from './gateway.interface';
import { BraipProvider } from './braip.provider';

export * from './gateway.interface';
export { BraipProvider } from './braip.provider';

export function createGatewayProvider(
  type: GatewayType,
  apiToken: string
): PaymentGateway {
  switch (type) {
    case 'BRAIP':
      return new BraipProvider(apiToken);
    default:
      throw new Error(`Gateway ${type} not implemented`);
  }
}
