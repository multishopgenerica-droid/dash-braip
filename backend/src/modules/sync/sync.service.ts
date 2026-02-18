import { GatewayConfig, SyncStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { decrypt } from '../../shared/utils/crypto';
import { createGatewayProvider, BraipSale, BraipAbandon, BraipProduct } from '../gateways/providers';

const BRAIP_PROXY_URL = process.env.BRAIP_PROXY_URL;

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
    const provider = createGatewayProvider(gateway.gateway, {
      apiToken: decryptedToken,
      proxyUrl: BRAIP_PROXY_URL,
    });

    // Sync sales
    try {
      const lastSync = gateway.lastSync?.toISOString();
      console.log(`Starting sales sync for gateway ${gatewayId}, lastSync: ${lastSync || 'none'}`);
      const sales = await provider.fetchSales({
        lastUpdateMin: lastSync,
      });
      console.log(`Received ${sales.length} sales from API`);

      for (const sale of sales) {
        await upsertSale(gatewayId, sale);
        result.salesSynced++;
      }
      console.log(`Synced ${result.salesSynced} sales to database`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Sales sync error: ${message}`, error);
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

    // Sync products from API
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

    // Also extract products from sales and abandons to ensure all products are captured
    try {
      const productsFromData = await syncProductsFromSalesAndAbandons(gatewayId);
      result.productsSynced += productsFromData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Products from data sync error: ${message}`);
    }

    // Sync plans from sales data
    try {
      await syncPlansFromSales(gatewayId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Plans sync error: ${message}`);
    }

    // Sync affiliates from sales data
    try {
      await syncAffiliatesFromSales(gatewayId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Affiliates sync error: ${message}`);
    }

    // Update product stats
    try {
      await updateProductStats(gatewayId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Product stats error: ${message}`);
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
  // Note: Braip API returns values already in cents (e.g., 9999 = R$ 99.99)
  const data = {
    gatewayConfigId: gatewayId,
    transKey: sale.trans_key,
    productKey: sale.product_key,
    planKey: sale.plan_key || null,
    productName: sale.product_name,
    planName: sale.plan_name || null,
    transValue: sale.trans_value,
    transTotalValue: sale.trans_total_value,
    transFreight: sale.trans_freight || null,
    transFreightType: sale.trans_freight_type || null,
    transStatus: sale.trans_status,
    transStatusCode: sale.trans_status_code,
    paymentType: sale.trans_payment,
    paymentDate: sale.trans_payment_date ? new Date(sale.trans_payment_date) : null,
    clientName: sale.client_name,
    clientEmail: sale.client_email,
    clientPhone: sale.client_cel || null,
    clientDocument: sale.client_documment || null,
    clientAddress: sale.client_address || null,
    clientCity: sale.client_address_city || null,
    clientState: sale.client_address_state || null,
    clientZipCode: sale.client_zip_code || null,
    hasOrderBump: sale.have_order_bump === 1,
    trackingCode: sale.tracking_code || null,
    shippingCompany: sale.shipping_company || null,
    commissions: sale.commissions || Prisma.DbNull,
    commissionsRelease: sale.commissions_release_date ? new Date(sale.commissions_release_date) : null,
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
}

async function upsertAbandon(gatewayId: string, abandon: BraipAbandon): Promise<void> {
  // Braip API returns fields with these names (according to API docs):
  // product_key, product_name, plan_key, plan_name, plan_amount
  // client_name, client_email, client_cel, client_documment
  // trans_createdate, trans_updatedate
  const productKey = abandon.product_key || abandon.prod_key || 'unknown';
  const clientEmail = abandon.client_email || abandon.cli_email;
  const transCreateDate = abandon.trans_createdate;

  const abandonKey = abandon.id || `${productKey}_${clientEmail || 'noemail'}_${transCreateDate}`;

  const data = {
    gatewayConfigId: gatewayId,
    abandonKey,
    productKey: productKey,
    productName: abandon.product_name || abandon.prod_name || 'Produto não identificado',
    planKey: abandon.plan_key || null,
    planName: abandon.plan_name || null,
    planAmount: abandon.plan_amount ? Number(abandon.plan_amount) : null,
    clientName: abandon.client_name || abandon.cli_name || null,
    clientEmail: clientEmail || null,
    clientPhone: abandon.client_cel || abandon.cli_cel || null,
    clientDocument: abandon.client_documment || abandon.cli_document || null,
    clientAddress: abandon.client_address || abandon.cli_address || null,
    clientCity: abandon.client_address_city || abandon.cli_address_city || null,
    clientState: abandon.client_address_state || abandon.cli_address_state || null,
    clientZipCode: abandon.client_zip_code || abandon.cli_address_zipcode || null,
    transCreateDate: new Date(transCreateDate),
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
    productHash: product.product_hash,
    name: product.name,
    description: product.description || null,
    thumbnail: product.thumbnail || null,
  };

  await prisma.product.upsert({
    where: {
      gatewayConfigId_productHash: {
        gatewayConfigId: gatewayId,
        productHash: product.product_hash,
      },
    },
    create: data,
    update: data,
  });
}

async function syncPlansFromSales(gatewayId: string): Promise<void> {
  // Get all products for this gateway
  const products = await prisma.product.findMany({
    where: { gatewayConfigId: gatewayId },
    select: { id: true, productHash: true },
  });

  const productMap = new Map(products.map(p => [p.productHash, p.id]));

  // Extract unique plans from sales with their stats
  const planStats = await prisma.sale.groupBy({
    by: ['productKey', 'planKey', 'planName'],
    where: {
      gatewayConfigId: gatewayId,
      planKey: { not: null },
    },
    _count: { id: true },
  });

  // Get approved sales stats
  const approvedStats = await prisma.sale.groupBy({
    by: ['productKey', 'planKey'],
    where: {
      gatewayConfigId: gatewayId,
      planKey: { not: null },
      transStatusCode: 2,
    },
    _count: { id: true },
    _sum: { transValue: true },
  });

  // Create a map of approved stats
  const approvedMap = new Map(
    approvedStats.map(s => [
      `${s.productKey}_${s.planKey}`,
      { count: s._count.id, revenue: s._sum.transValue || 0 },
    ])
  );

  // Upsert each plan
  for (const stat of planStats) {
    if (!stat.planKey || !stat.planName) continue;

    const productId = productMap.get(stat.productKey);
    if (!productId) continue;

    const approvedKey = `${stat.productKey}_${stat.planKey}`;
    const approved = approvedMap.get(approvedKey) || { count: 0, revenue: 0 };

    await prisma.plan.upsert({
      where: {
        productId_planKey: {
          productId,
          planKey: stat.planKey,
        },
      },
      create: {
        productId,
        planKey: stat.planKey,
        planName: stat.planName,
        totalSales: approved.count,
        totalRevenue: approved.revenue,
      },
      update: {
        planName: stat.planName,
        totalSales: approved.count,
        totalRevenue: approved.revenue,
      },
    });
  }
}

async function syncAffiliatesFromSales(gatewayId: string): Promise<void> {
  // Use raw SQL to extract affiliates from JSON commissions
  await prisma.$executeRaw`
    INSERT INTO affiliates (id, "gatewayConfigId", "affiliateHash", name, email, phone, document, "totalSales", "totalRevenue", "totalCommission", "updatedAt")
    SELECT
      'aff_' || MD5(s."gatewayConfigId" || '_' || (elem->>'affiliate_hash')) as id,
      s."gatewayConfigId",
      elem->>'affiliate_hash' as "affiliateHash",
      MAX(elem->>'name') as name,
      MAX(elem->>'email') as email,
      MAX(elem->>'phone') as phone,
      MAX(elem->>'document') as document,
      COUNT(*) FILTER (WHERE s."transStatusCode" = 2) as "totalSales",
      COALESCE(SUM(s."transValue") FILTER (WHERE s."transStatusCode" = 2), 0) as "totalRevenue",
      COALESCE(SUM((elem->>'value')::int) FILTER (WHERE s."transStatusCode" = 2), 0) as "totalCommission",
      now() as "updatedAt"
    FROM sales s,
    LATERAL jsonb_array_elements(s.commissions) elem
    WHERE s."gatewayConfigId" = ${gatewayId}
      AND elem->>'type' = 'Afiliado'
      AND elem->>'affiliate_hash' IS NOT NULL
    GROUP BY s."gatewayConfigId", elem->>'affiliate_hash'
    ON CONFLICT ("gatewayConfigId", "affiliateHash") DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      document = EXCLUDED.document,
      "totalSales" = EXCLUDED."totalSales",
      "totalRevenue" = EXCLUDED."totalRevenue",
      "totalCommission" = EXCLUDED."totalCommission",
      "updatedAt" = now()
  `;
}

async function updateProductStats(gatewayId: string): Promise<void> {
  // Update product sales stats
  await prisma.$executeRaw`
    UPDATE products p
    SET
      "totalSales" = sub.total_sales,
      "totalRevenue" = sub.total_revenue,
      "updatedAt" = now()
    FROM (
      SELECT
        s."productKey",
        COUNT(*) FILTER (WHERE s."transStatusCode" = 2) as total_sales,
        COALESCE(SUM(s."transValue") FILTER (WHERE s."transStatusCode" = 2), 0) as total_revenue
      FROM sales s
      WHERE s."gatewayConfigId" = ${gatewayId}
      GROUP BY s."productKey"
    ) sub
    WHERE p."productHash" = sub."productKey"
      AND p."gatewayConfigId" = ${gatewayId}
  `;

  // Update abandon stats
  await prisma.$executeRaw`
    UPDATE products p
    SET
      "totalAbandons" = sub.total_abandons
    FROM (
      SELECT
        a."productKey",
        COUNT(*) as total_abandons
      FROM abandons a
      WHERE a."gatewayConfigId" = ${gatewayId}
      GROUP BY a."productKey"
    ) sub
    WHERE p."productHash" = sub."productKey"
      AND p."gatewayConfigId" = ${gatewayId}
  `;

  // Update conversion rate
  await prisma.$executeRaw`
    UPDATE products
    SET "conversionRate" =
      CASE
        WHEN ("totalSales" + "totalAbandons") > 0
        THEN ("totalSales"::float / ("totalSales" + "totalAbandons") * 100)
        ELSE 0
      END
    WHERE "gatewayConfigId" = ${gatewayId}
  `;
}

async function syncProductsFromSalesAndAbandons(gatewayId: string): Promise<number> {
  let count = 0;

  // Extract unique products from sales
  const salesProducts = await prisma.sale.findMany({
    where: { gatewayConfigId: gatewayId },
    select: {
      productKey: true,
      productName: true,
    },
    distinct: ['productKey'],
  });

  // Extract unique products from abandons
  const abandonProducts = await prisma.abandon.findMany({
    where: { gatewayConfigId: gatewayId },
    select: {
      productKey: true,
      productName: true,
    },
    distinct: ['productKey'],
  });

  // Combine and deduplicate
  const productMap = new Map<string, string>();

  for (const sale of salesProducts) {
    if (sale.productKey && !productMap.has(sale.productKey)) {
      productMap.set(sale.productKey, sale.productName);
    }
  }

  for (const abandon of abandonProducts) {
    if (abandon.productKey && !productMap.has(abandon.productKey)) {
      productMap.set(abandon.productKey, abandon.productName);
    }
  }

  // Upsert each product
  for (const [productHash, name] of productMap) {
    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: {
        gatewayConfigId_productHash: {
          gatewayConfigId: gatewayId,
          productHash,
        },
      },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          gatewayConfigId: gatewayId,
          productHash,
          name,
        },
      });
      count++;
    }
  }

  return count;
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
