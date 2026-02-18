import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { AppError } from '../../shared/middlewares/error.middleware';
import { SALE_STATUS } from '../../shared/constants/status-codes';
import { ProductsQueryDTO } from './products.dto';

export async function listProducts(
  userId: string,
  query: ProductsQueryDTO
): Promise<PaginatedResult<unknown>> {
  const { skip, take, page } = getPaginationParams(query);

  const where: Prisma.ProductWhereInput = {
    gatewayConfig: { userId },
  };

  if (query.gatewayId) {
    where.gatewayConfigId = query.gatewayId;
  }

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { totalSales: 'desc' },
      include: {
        gatewayConfig: {
          select: { gateway: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return createPaginatedResult(products, total, page, take);
}

export async function getProductById(userId: string, productId: string): Promise<unknown> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      gatewayConfig: { userId },
    },
    include: {
      gatewayConfig: {
        select: { gateway: true },
      },
    },
  });

  if (!product) {
    throw new AppError(404, 'Produto nao encontrado');
  }

  return product;
}

export async function getProductMetrics(
  userId: string,
  productId: string
): Promise<unknown> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      gatewayConfig: { userId },
    },
  });

  if (!product) {
    throw new AppError(404, 'Produto nao encontrado');
  }

  // Get sales data
  const [totalSales, approvedSales, pendingSales, canceledSales] = await Promise.all([
    prisma.sale.count({
      where: { productKey: product.productHash, gatewayConfig: { userId } },
    }),
    prisma.sale.count({
      where: {
        productKey: product.productHash,
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
      },
    }),
    prisma.sale.count({
      where: {
        productKey: product.productHash,
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.AGUARDANDO_PAGAMENTO,
      },
    }),
    prisma.sale.count({
      where: {
        productKey: product.productHash,
        gatewayConfig: { userId },
        transStatusCode: SALE_STATUS.CANCELADA,
      },
    }),
  ]);

  const revenue = await prisma.sale.aggregate({
    where: {
      productKey: product.productHash,
      gatewayConfig: { userId },
      transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
    },
    _sum: { transValue: true },
  });

  const abandons = await prisma.abandon.count({
    where: {
      productKey: product.productHash,
      gatewayConfig: { userId },
    },
  });

  const conversionRate = totalSales > 0 ? ((approvedSales / totalSales) * 100).toFixed(2) : 0;

  return {
    product,
    metrics: {
      totalSales,
      approvedSales,
      pendingSales,
      canceledSales,
      totalRevenue: revenue._sum.transValue || 0,
      abandons,
      conversionRate,
    },
  };
}

export async function getProductsRanking(
  userId: string,
  gatewayId?: string,
  order: 'best' | 'worst' = 'best',
  limit: number = 10
): Promise<unknown[]> {
  const where: Prisma.SaleWhereInput = {
    gatewayConfig: { userId },
    transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
  };

  if (gatewayId) {
    where.gatewayConfigId = gatewayId;
  }

  const result = await prisma.sale.groupBy({
    by: ['productKey', 'productName'],
    where,
    _count: true,
    _sum: {
      transValue: true,
    },
    orderBy: {
      _count: {
        productKey: order === 'best' ? 'desc' : 'asc',
      },
    },
    take: limit,
  });

  return result.map((item, index) => ({
    rank: index + 1,
    productKey: item.productKey,
    productName: item.productName,
    salesCount: item._count,
    totalRevenue: item._sum.transValue || 0,
  }));
}

export async function getTopSellers(
  userId: string,
  gatewayId?: string,
  limit: number = 10
): Promise<unknown[]> {
  return getProductsRanking(userId, gatewayId, 'best', limit);
}

export async function getWorstSellers(
  userId: string,
  gatewayId?: string,
  limit: number = 10
): Promise<unknown[]> {
  return getProductsRanking(userId, gatewayId, 'worst', limit);
}

export async function updateProductMetrics(
  gatewayConfigId: string,
  productHash: string
): Promise<void> {
  const [salesCount, revenue, abandonsCount] = await Promise.all([
    prisma.sale.count({
      where: {
        gatewayConfigId,
        productKey: productHash,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
      },
    }),
    prisma.sale.aggregate({
      where: {
        gatewayConfigId,
        productKey: productHash,
        transStatusCode: SALE_STATUS.PAGAMENTO_APROVADO,
      },
      _sum: { transValue: true },
    }),
    prisma.abandon.count({
      where: {
        gatewayConfigId,
        productKey: productHash,
      },
    }),
  ]);

  const totalAttempts = salesCount + abandonsCount;
  const conversionRate = totalAttempts > 0 ? (salesCount / totalAttempts) * 100 : 0;

  await prisma.product.update({
    where: {
      gatewayConfigId_productHash: {
        gatewayConfigId,
        productHash,
      },
    },
    data: {
      totalSales: salesCount,
      totalRevenue: revenue._sum.transValue || 0,
      totalAbandons: abandonsCount,
      conversionRate,
    },
  });
}
