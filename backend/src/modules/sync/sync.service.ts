import { GatewayConfig, SyncStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { decrypt } from '../../shared/utils/crypto';
import { createGatewayProvider, BraipSale, BraipAbandon, BraipProduct } from '../gateways/providers';

export interface SyncResult {
  success: boolean;
  salesSynced: number;
  abandonsSynced: number;
  productsSynced: number;
  errors: string[];
}

export async function syncGateway(gatewayId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    salesSynced: 0,
    abandonsSynced: 0,
    productsSynced: 0,
    errors: [],
  };

  const gateway = await prisma.gatewayConfig.findUnique({
    where: { id: gatewayId },
  });

  if (!gateway) {
    throw new Error('Gateway not found');
  }

  // Update status to syncing
  await prisma.gatewayConfig.update({
    where: { id: gatewayId },
    data: { syncStatus: SyncStatus.SYNCING },
  });

  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      gatewayConfigId: gatewayId,
      status: SyncStatus.SYNCING,
    },
  });

  try {
    const decryptedToken = decrypt(gateway.apiToken);
    const provider = createGatewayProvider(gateway.gateway, decryptedToken);

    // Sync sales
    try {
      const lastSync = gateway.lastSync?.toISOString();
      const sales = await provider.fetchSales({
        lastUpdateMin: lastSync,
      });

      for (const sale of sales) {
        await upsertSale(gatewayId, sale);
        result.salesSynced++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Sales sync error: ${message}`);
    }

    // Sync abandons
    try {
      const abandons = await provider.fetchAbandons({});

      for (const abandon of abandons) {
        await upsertAbandon(gatewayId, abandon);
        result.abandonsSynced++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Abandons sync error: ${message}`);
    }

    // Sync products
    try {
      const products = await provider.fetchProducts();

      for (const product of products) {
        await upsertProduct(gatewayId, product);
        result.productsSynced++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Products sync error: ${message}`);
    }

    // Update gateway status
    await prisma.gatewayConfig.update({
      where: { id: gatewayId },
      data: {
        lastSync: new Date(),
        syncStatus: result.errors.length > 0 ? SyncStatus.ERROR : SyncStatus.COMPLETED,
      },
    });

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        status: result.errors.length > 0 ? SyncStatus.ERROR : SyncStatus.COMPLETED,
        recordsSynced: result.salesSynced + result.abandonsSynced + result.productsSynced,
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
      },
    });

    result.success = result.errors.length === 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
    result.errors.push(message);

    await prisma.gatewayConfig.update({
      where: { id: gatewayId },
      data: { syncStatus: SyncStatus.ERROR },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        status: SyncStatus.ERROR,
        errorMessage: message,
      },
    });
  }

  return result;
}

async function upsertSale(gatewayId: string, sale: BraipSale): Promise<void> {
  const data = {
    gatewayConfigId: gatewayId,
    transKey: sale.trans_key,
    productKey: sale.prod_key,
    planKey: sale.plan_key || null,
    productName: sale.prod_name,
    planName: sale.plan_name || null,
    transValue: Math.round(sale.trans_value * 100),
    transTotalValue: Math.round(sale.trans_total_value * 100),
    transFreight: sale.trans_freight ? Math.round(sale.trans_freight * 100) : null,
    transFreightType: sale.trans_freight_type || null,
    transStatus: sale.trans_status,
    transStatusCode: sale.trans_status_code,
    paymentType: sale.trans_payment,
    paymentDate: sale.trans_payment_date ? new Date(sale.trans_payment_date) : null,
    clientName: sale.cli_name,
    clientEmail: sale.cli_email,
    clientPhone: sale.cli_cel || null,
    clientDocument: sale.cli_document || null,
    clientAddress: sale.cli_address || null,
    clientCity: sale.cli_address_city || null,
    clientState: sale.cli_address_state || null,
    clientZipCode: sale.cli_address_zipcode || null,
    hasOrderBump: sale.has_order_bump || false,
    trackingCode: sale.tracking_code || null,
    shippingCompany: sale.shipping_company || null,
    commissions: sale.commissions || null,
    commissionsRelease: sale.commissions_release ? new Date(sale.commissions_release) : null,
    transCreateDate: new Date(sale.trans_createdate),
    transUpdateDate: new Date(sale.trans_updatedate),
  };

  await prisma.sale.upsert({
    where: {
      gatewayConfigId_transKey: {
        gatewayConfigId: gatewayId,
        transKey: sale.trans_key,
      },
    },
    create: data,
    update: data,
  });

  // Upsert sale items if present
  if (sale.items && sale.items.length > 0) {
    const saleRecord = await prisma.sale.findUnique({
      where: {
        gatewayConfigId_transKey: {
          gatewayConfigId: gatewayId,
          transKey: sale.trans_key,
        },
      },
    });

    if (saleRecord) {
      // Delete existing items and recreate
      await prisma.saleItem.deleteMany({
        where: { saleId: saleRecord.id },
      });

      await prisma.saleItem.createMany({
        data: sale.items.map((item) => ({
          saleId: saleRecord.id,
          planKey: item.plan_key,
          planName: item.plan_name,
          planValue: Math.round(item.plan_value * 100),
          planAmount: item.plan_amount,
          productKey: item.prod_key,
          productType: item.prod_type,
          isMain: item.is_main,
        })),
      });
    }
  }
}

async function upsertAbandon(gatewayId: string, abandon: BraipAbandon): Promise<void> {
  const abandonKey = abandon.id || `${abandon.prod_key}_${abandon.cli_email}_${abandon.trans_createdate}`;

  const data = {
    gatewayConfigId: gatewayId,
    abandonKey,
    productKey: abandon.prod_key,
    productName: abandon.prod_name,
    planKey: abandon.plan_key || null,
    planName: abandon.plan_name || null,
    planAmount: abandon.plan_amount || null,
    clientName: abandon.cli_name || null,
    clientEmail: abandon.cli_email || null,
    clientPhone: abandon.cli_cel || null,
    clientDocument: abandon.cli_document || null,
    clientAddress: abandon.cli_address || null,
    clientCity: abandon.cli_address_city || null,
    clientState: abandon.cli_address_state || null,
    clientZipCode: abandon.cli_address_zipcode || null,
    transCreateDate: new Date(abandon.trans_createdate),
    transUpdateDate: new Date(abandon.trans_updatedate),
  };

  await prisma.abandon.upsert({
    where: {
      gatewayConfigId_abandonKey: {
        gatewayConfigId: gatewayId,
        abandonKey,
      },
    },
    create: data,
    update: data,
  });
}

async function upsertProduct(gatewayId: string, product: BraipProduct): Promise<void> {
  const data = {
    gatewayConfigId: gatewayId,
    productHash: product.prod_hash,
    name: product.prod_name,
    description: product.prod_description || null,
    thumbnail: product.prod_thumbnail || null,
  };

  await prisma.product.upsert({
    where: {
      gatewayConfigId_productHash: {
        gatewayConfigId: gatewayId,
        productHash: product.prod_hash,
      },
    },
    create: data,
    update: data,
  });
}

export async function syncAllActiveGateways(): Promise<void> {
  const gateways = await prisma.gatewayConfig.findMany({
    where: { isActive: true },
  });

  for (const gateway of gateways) {
    try {
      await syncGateway(gateway.id);
    } catch (error) {
      console.error(`Error syncing gateway ${gateway.id}:`, error);
    }
  }
}
