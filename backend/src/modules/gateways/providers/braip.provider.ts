import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  PaymentGateway,
  SalesFilter,
  AbandonFilter,
  BraipSale,
  BraipAbandon,
  BraipProduct,
} from './gateway.interface';

const BRAIP_API_URL = 'https://ev.braip.com';

export interface BraipProviderOptions {
  apiToken: string;
  proxyUrl?: string;
}

export class BraipProvider implements PaymentGateway {
  public readonly name = 'BRAIP';
  private client: AxiosInstance;

  constructor(options: BraipProviderOptions | string) {
    const config = typeof options === 'string'
      ? { apiToken: options }
      : options;

    const axiosConfig: Record<string, unknown> = {
      baseURL: BRAIP_API_URL,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 60000,
    };

    // Add proxy support
    if (config.proxyUrl) {
      const proxyAgent = new HttpsProxyAgent(config.proxyUrl);
      axiosConfig.httpsAgent = proxyAgent;
      axiosConfig.httpAgent = proxyAgent;
      console.log('BraipProvider: Using proxy');
    }

    this.client = axios.create(axiosConfig);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/vendas', {
        params: { page: 1 },
      });
      console.log('Braip testConnection response:', response.status, response.data?.message || 'OK');
      return response.status === 200;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('Braip testConnection error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      return false;
    }
  }

  async fetchSales(params: SalesFilter): Promise<BraipSale[]> {
    const allSales: BraipSale[] = [];

    // Braip API requires date_min/date_max with max 6 months range
    // Generate date ranges to fetch all sales
    const dateRanges = this.generateDateRanges(params.startDate, params.endDate);

    for (const range of dateRanges) {
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const queryParams: Record<string, unknown> = {
          page: currentPage,
          date_min: range.start,
          date_max: range.end,
        };

        if (params.status) {
          queryParams.trans_status = params.status;
        }

        try {
          const response = await this.client.get('/api/vendas', {
            params: queryParams,
          });

          const data = response.data;
          const sales = data.data || [];

          allSales.push(...sales);

          hasMorePages = data.next_page_url !== null;
          currentPage++;

          // Rate limiting protection
          if (hasMorePages) {
            await this.delay(200);
          }
        } catch (error) {
          console.error('Error fetching Braip sales:', error);
          hasMorePages = false;
        }
      }

      // Delay between date ranges
      await this.delay(300);
    }

    return allSales;
  }

  private generateDateRanges(startDate?: string, endDate?: string): Array<{start: string, end: string}> {
    const ranges: Array<{start: string, end: string}> = [];

    // Default: last 6 months if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);

    let currentStart = new Date(start);

    while (currentStart < end) {
      const currentEnd = new Date(currentStart);
      currentEnd.setMonth(currentEnd.getMonth() + 5); // 5 months to be safe (max is 6)
      currentEnd.setDate(currentEnd.getDate() + 25);

      if (currentEnd > end) {
        currentEnd.setTime(end.getTime());
      }

      ranges.push({
        start: this.formatDate(currentStart),
        end: this.formatDate(currentEnd),
      });

      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }

    // Ensure at least one range exists
    if (ranges.length === 0) {
      ranges.push({
        start: this.formatDate(start),
        end: this.formatDate(end),
      });
    }

    return ranges;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
  }

  async fetchAbandons(params: AbandonFilter): Promise<BraipAbandon[]> {
    const allAbandons: BraipAbandon[] = [];
    let currentPage = params.page || 1;
    let hasMorePages = true;

    // Braip API endpoint for abandonos
    const endpoint = '/api/v1/abandonos/';

    // Calculate default date range if not provided
    // Both date_min and date_max are required by Braip API
    // Using Brazil timezone (America/Sao_Paulo)
    const now = new Date();
    // Use yesterday as end date to avoid timezone issues
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const defaultEndDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')} 23:59:59`;

    // Default to 6 months ago
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const defaultStartDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-${String(sixMonthsAgo.getDate()).padStart(2, '0')} 00:00:00`;

    while (hasMorePages) {
      // Only use parameters documented by Braip API:
      // - page: pagination
      // - date_min: format "YYYY-mm-dd HH:ii:ss" (REQUIRED)
      // - date_max: format "YYYY-mm-dd HH:ii:ss"
      // - product_key: filter by product
      // Both date_min and date_max are required by Braip API
      const queryParams: Record<string, unknown> = {
        page: currentPage,
        date_min: params.startDate
          ? (params.startDate.includes(' ') ? params.startDate : `${params.startDate} 00:00:00`)
          : defaultStartDate,
        date_max: params.endDate
          ? (params.endDate.includes(' ') ? params.endDate : `${params.endDate} 23:59:59`)
          : defaultEndDate,
      };

      try {
        console.log(`Fetching abandons from ${endpoint}, page ${currentPage}, params:`, queryParams);
        const response = await this.client.get(endpoint, {
          params: queryParams,
        });

        const data = response.data;
        console.log(`Braip abandons response - total: ${data.total}, last_page: ${data.last_page}, current_page: ${data.current_page}`);

        const abandons = data.data || [];

        if (Array.isArray(abandons) && abandons.length > 0) {
          allAbandons.push(...abandons);
          console.log(`Fetched ${abandons.length} abandons from page ${currentPage}`);
        }

        // Check for more pages using Braip's response format
        hasMorePages = data.next_page_url !== null;

        // Also check using last_page
        if (data.last_page && currentPage >= data.last_page) {
          hasMorePages = false;
        }

        currentPage++;

        if (hasMorePages) {
          await this.delay(200);
        }
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
        console.error(`Error fetching Braip abandons:`, {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        });
        hasMorePages = false;
      }
    }

    console.log(`Total abandons fetched: ${allAbandons.length}`);
    return allAbandons;
  }

  async fetchProducts(): Promise<BraipProduct[]> {
    const products: BraipProduct[] = [];

    // Helper function to fetch all pages from an endpoint
    const fetchAllPages = async (endpoint: string, source: string): Promise<BraipProduct[]> => {
      const items: BraipProduct[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        try {
          console.log(`Fetching ${source} products, page ${currentPage}`);
          const response = await this.client.get(endpoint, {
            params: { page: currentPage },
          });

          const data = response.data;
          const pageProducts = data.data || data.products || data.items || [];

          if (Array.isArray(pageProducts) && pageProducts.length > 0) {
            items.push(...pageProducts);
            console.log(`Fetched ${pageProducts.length} ${source} products from page ${currentPage}`);
          }

          // Check for more pages
          hasMorePages = data.next_page_url !== null && data.next_page_url !== undefined;

          // Also check meta/pagination
          if (data.meta?.last_page && currentPage < data.meta.last_page) {
            hasMorePages = true;
          } else if (data.last_page && currentPage < data.last_page) {
            hasMorePages = true;
          }

          // If no products returned, stop
          if (!pageProducts || pageProducts.length === 0) {
            hasMorePages = false;
          }

          currentPage++;

          if (hasMorePages) {
            await this.delay(200);
          }
        } catch (error: unknown) {
          const axiosError = error as { response?: { status?: number }; message?: string };
          console.error(`Error fetching ${source} products:`, {
            status: axiosError.response?.status,
            message: axiosError.message,
          });
          hasMorePages = false;
        }
      }

      return items;
    };

    // Fetch producer products with pagination
    const producerProducts = await fetchAllPages('/api/v1/producers/products', 'producer');
    products.push(...producerProducts);

    await this.delay(300);

    // Fetch co-producer products with pagination
    const coProducerProducts = await fetchAllPages('/api/v1/co-producers/products', 'co-producer');
    products.push(...coProducerProducts);

    await this.delay(300);

    // Fetch affiliate products with pagination
    const affiliateProducts = await fetchAllPages('/api/v1/affiliates/products', 'affiliate');
    products.push(...affiliateProducts);

    // Remove duplicates by product_hash
    const uniqueProducts = products.reduce((acc, product) => {
      if (!acc.find(p => p.product_hash === product.product_hash)) {
        acc.push(product);
      }
      return acc;
    }, [] as BraipProduct[]);

    console.log(`Total unique products fetched: ${uniqueProducts.length}`);
    return uniqueProducts;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
