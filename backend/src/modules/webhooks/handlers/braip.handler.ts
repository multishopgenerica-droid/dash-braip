import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';

// Braip webhook event types
export type BraipEventType =
  | 'sale_created'
  | 'sale_approved'
  | 'sale_canceled'
  | 'sale_refunded'
  | 'sale_chargeback'
  | 'sale_in_analysis'
  | 'sale_waiting_payment'
  | 'abandon_created'
  | 'subscription_created'
  | 'subscription_canceled';

// Braip webhook payload structure
export interface BraipWebhookPayload {
  event: string;
  data: BraipSaleData | BraipAbandonData;
}

export interface BraipSaleData {
  trans_key: string;
  prod_key: string;
  plan_key?: string;
  prod_name: string;
  plan_name?: string;
  trans_value: number;
  trans_total_value: number;
  trans_freight?: number;
  trans_freight_type?: string;
  trans_status: string;
  trans_status_code: number;
  trans_payment: number;
  trans_payment_date?: string;
  cli_name: string;
  cli_email: string;
  cli_cel?: string;
  cli_document?: string;
  cli_address?: string;
  cli_address_city?: string;
  cli_address_state?: string;
  cli_address_zipcode?: string;
  has_order_bump?: boolean;
  tracking_code?: string;
  shipping_company?: string;
  commissions?: Record<string, unknown>;
  commissions_release?: string;
  trans_createdate: string;
  trans_updatedate: string;
  items?: BraipSaleItem[];
}

export interface BraipSaleItem {
  plan_key: string;
  plan_name: string;
  plan_value: number;
  plan_amount: number;
  prod_key: string;
  prod_type: number;
  is_main?: boolean;
}

export interface BraipAbandonData {
  prod_key: string;
  prod_name: string;
  plan_key?: string;
  plan_name?: string;
  plan_amount?: number;
  cli_name?: string;
  cli_email?: string;
  cli_cel?: string;
  cli_document?: string;
  cli_address?: string;
  cli_address_city?: string;
  cli_address_state?: string;
  cli_address_zipcode?: string;
  trans_createdate: string;
  trans_updatedate?: string;
}

export async function handleBraipWebhook(
  gatewayId: string,
  payload: BraipWebhookPayload
): Promise<{ success: boolean; message: string }> {
  const event = payload.event?.toLowerCase() || '';

  console.log(`Processing Braip webhook: ${event} for gateway ${gatewayId}`);

  try {
    // Handle sale events
    if (event.includes('sale') || event.includes('venda')) {
      await handleSaleEvent(gatewayId, payload.data as BraipSaleData);
      return { success: true, message: `Sale event ${event} processed` };
    }

    // Handle abandon events
    if (event.includes('abandon')) {
      await handleAbandonEvent(gatewayId, payload.data as BraipAbandonData);
      return { success: true, message: `Abandon event ${event} processed` };
    }

    // Log unhandled events
    console.log(`Unhandled Braip event: ${event}`);
    return { success: true, message: `Event ${event} acknowledged but not processed` };

  } catch (error) {
    console.error('Error processing Braip webhook:', error);
    throw error;
  }
}

async function handleSaleEvent(gatewayId: string, sale: BraipSaleData): Promise<void> {
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
    commissions: sale.commissions ? (sale.commissions as Prisma.InputJsonValue) : Prisma.DbNull,
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

  // Handle sale items if present
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
          planAmount: item.plan_amount || 1,
          productKey: item.prod_key || sale.prod_key,
          productType: item.prod_type || 0,
          isMain: item.is_main || false,
        })),
      });
    }
  }

  // Update product metrics
  await updateProductMetrics(gatewayId, sale.prod_key, sale.prod_name);

  console.log(`Sale ${sale.trans_key} processed successfully`);
}

async function handleAbandonEvent(gatewayId: string, abandon: BraipAbandonData): Promise<void> {
  const abandonKey = `${abandon.prod_key}-${abandon.cli_email || 'unknown'}-${abandon.trans_createdate}`;
  const transCreateDate = new Date(abandon.trans_createdate);
  const transUpdateDate = abandon.trans_updatedate ? new Date(abandon.trans_updatedate) : transCreateDate;

  await prisma.abandon.upsert({
    where: {
      gatewayConfigId_abandonKey: {
        gatewayConfigId: gatewayId,
        abandonKey,
      },
    },
    create: {
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
      transCreateDate,
      transUpdateDate,
    },
    update: {
      productName: abandon.prod_name,
      planName: abandon.plan_name || null,
      planAmount: abandon.plan_amount || null,
      clientName: abandon.cli_name || null,
      clientPhone: abandon.cli_cel || null,
      clientDocument: abandon.cli_document || null,
      clientAddress: abandon.cli_address || null,
      clientCity: abandon.cli_address_city || null,
      clientState: abandon.cli_address_state || null,
      clientZipCode: abandon.cli_address_zipcode || null,
      transUpdateDate,
    },
  });

  // Update product abandon metrics
  await updateProductAbandonMetrics(gatewayId, abandon.prod_key, abandon.prod_name);

  console.log(`Abandon for product ${abandon.prod_key} processed successfully`);
}

async function updateProductMetrics(
  gatewayId: string,
  productKey: string,
  productName: string
): Promise<void> {
  // Get sale stats for this product
  const stats = await prisma.sale.aggregate({
    where: {
      gatewayConfigId: gatewayId,
      productKey,
    },
    _count: true,
    _sum: {
      transValue: true,
    },
  });

  const approvedStats = await prisma.sale.aggregate({
    where: {
      gatewayConfigId: gatewayId,
      productKey,
      transStatusCode: 2,
    },
    _count: true,
    _sum: {
      transValue: true,
    },
  });

  await prisma.product.upsert({
    where: {
      gatewayConfigId_productHash: {
        gatewayConfigId: gatewayId,
        productHash: productKey,
      },
    },
    create: {
      gatewayConfigId: gatewayId,
      productHash: productKey,
      name: productName,
      totalSales: stats._count,
      totalRevenue: approvedStats._sum.transValue || 0,
    },
    update: {
      name: productName,
      totalSales: stats._count,
      totalRevenue: approvedStats._sum.transValue || 0,
    },
  });
}

async function updateProductAbandonMetrics(
  gatewayId: string,
  productKey: string,
  productName: string
): Promise<void> {
  const abandonCount = await prisma.abandon.count({
    where: {
      gatewayConfigId: gatewayId,
      productKey,
    },
  });

  await prisma.product.upsert({
    where: {
      gatewayConfigId_productHash: {
        gatewayConfigId: gatewayId,
        productHash: productKey,
      },
    },
    create: {
      gatewayConfigId: gatewayId,
      productHash: productKey,
      name: productName,
      totalAbandons: abandonCount,
    },
    update: {
      totalAbandons: abandonCount,
    },
  });
}
