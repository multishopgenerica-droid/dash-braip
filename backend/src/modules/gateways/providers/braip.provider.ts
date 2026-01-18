import axios, { AxiosInstance } from 'axios';
import {
  PaymentGateway,
  SalesFilter,
  AbandonFilter,
  BraipSale,
  BraipAbandon,
  BraipProduct,
} from './gateway.interface';

const BRAIP_API_URL = 'https://ev.braip.com';

export class BraipProvider implements PaymentGateway {
  public readonly name = 'BRAIP';
  private client: AxiosInstance;

  constructor(apiToken: string) {
    this.client = axios.create({
      baseURL: BRAIP_API_URL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
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
    let currentPage = params.page || 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const queryParams: Record<string, unknown> = {
        page: currentPage,
      };

      if (params.startDate) {
        queryParams.trans_createdate_min = params.startDate;
      }
      if (params.endDate) {
        queryParams.trans_createdate_max = params.endDate;
      }
      if (params.status) {
        queryParams.trans_status = params.status;
      }
      if (params.lastUpdateMin) {
        queryParams.last_update_min = params.lastUpdateMin;
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

    return allSales;
  }

  async fetchAbandons(params: AbandonFilter): Promise<BraipAbandon[]> {
    const allAbandons: BraipAbandon[] = [];
    let currentPage = params.page || 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const queryParams: Record<string, unknown> = {
        page: currentPage,
      };

      if (params.startDate) {
        queryParams.trans_createdate_min = params.startDate;
      }
      if (params.endDate) {
        queryParams.trans_createdate_max = params.endDate;
      }

      try {
        const response = await this.client.get('/api/v1/abandonos/', {
          params: queryParams,
        });

        const data = response.data;
        const abandons = data.data || [];

        allAbandons.push(...abandons);

        hasMorePages = data.next_page_url !== null;
        currentPage++;

        if (hasMorePages) {
          await this.delay(200);
        }
      } catch (error) {
        console.error('Error fetching Braip abandons:', error);
        hasMorePages = false;
      }
    }

    return allAbandons;
  }

  async fetchProducts(): Promise<BraipProduct[]> {
    const products: BraipProduct[] = [];

    // Fetch producer products
    try {
      const producerResponse = await this.client.get('/api/v1/producers/products');
      if (producerResponse.data?.data) {
        products.push(...producerResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching producer products:', error);
    }

    await this.delay(200);

    // Fetch co-producer products
    try {
      const coProducerResponse = await this.client.get('/api/v1/co-producers/products');
      if (coProducerResponse.data?.data) {
        products.push(...coProducerResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching co-producer products:', error);
    }

    await this.delay(200);

    // Fetch affiliate products
    try {
      const affiliateResponse = await this.client.get('/api/v1/affiliates/products');
      if (affiliateResponse.data?.data) {
        products.push(...affiliateResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching affiliate products:', error);
    }

    // Remove duplicates by prod_hash
    const uniqueProducts = products.reduce((acc, product) => {
      if (!acc.find(p => p.prod_hash === product.prod_hash)) {
        acc.push(product);
      }
      return acc;
    }, [] as BraipProduct[]);

    return uniqueProducts;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
