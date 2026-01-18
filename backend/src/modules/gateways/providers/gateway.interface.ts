export interface SalesFilter {
  startDate?: string;
  endDate?: string;
  status?: number;
  page?: number;
  lastUpdateMin?: string;
}

export interface AbandonFilter {
  startDate?: string;
  endDate?: string;
  page?: number;
}

export interface BraipSale {
  trans_key: string;
  prod_key: string;
  plan_key: string;
  prod_name: string;
  plan_name: string;
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
  commissions?: unknown;
  commissions_release?: string;
  items?: BraipSaleItem[];
  trans_createdate: string;
  trans_updatedate: string;
}

export interface BraipSaleItem {
  plan_key: string;
  plan_name: string;
  plan_value: number;
  plan_amount: number;
  prod_key: string;
  prod_type: number;
  is_main: boolean;
}

export interface BraipAbandon {
  id?: string;
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
  trans_updatedate: string;
}

export interface BraipProduct {
  prod_hash: string;
  prod_name: string;
  prod_description?: string;
  prod_thumbnail?: string;
}

export interface SyncResult {
  success: boolean;
  salesSynced: number;
  abandonsSynced: number;
  productsSynced: number;
  errors: string[];
}

export interface PaymentGateway {
  name: string;
  testConnection(): Promise<boolean>;
  fetchSales(params: SalesFilter): Promise<BraipSale[]>;
  fetchAbandons(params: AbandonFilter): Promise<BraipAbandon[]>;
  fetchProducts(): Promise<BraipProduct[]>;
}
