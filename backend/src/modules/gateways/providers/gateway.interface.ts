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
  product_key: string;
  plan_key: string;
  product_name: string;
  plan_name: string;
  plan_amount: number;
  trans_value: number;
  trans_total_value: number;
  trans_discount_value?: number;
  trans_freight?: number;
  trans_freight_type?: string;
  trans_status: string;
  trans_status_code: number;
  trans_payment: number;
  trans_payment_date?: string;
  trans_installments?: number;
  client_name: string;
  client_email: string;
  client_cel?: string;
  client_documment?: string;
  client_address?: string;
  client_address_city?: string;
  client_address_state?: string;
  client_zip_code?: string;
  have_order_bump?: number;
  tracking_code?: string;
  shipping_company?: string;
  commissions?: unknown;
  commissions_release_date?: string;
  meta?: Record<string, string>;
  trans_createdate: string;
  trans_updatedate: string;
}

export interface BraipAbandon {
  id?: string;
  // Product fields - API uses both formats
  prod_key?: string;
  prod_name?: string;
  product_key?: string;
  product_name?: string;
  // Plan fields
  plan_key?: string;
  plan_name?: string;
  plan_amount?: number;
  // Client fields - old format (cli_)
  cli_name?: string;
  cli_email?: string;
  cli_cel?: string;
  cli_document?: string;
  cli_address?: string;
  cli_address_city?: string;
  cli_address_state?: string;
  cli_address_zipcode?: string;
  // Client fields - new format (client_) per API docs
  client_name?: string;
  client_email?: string;
  client_cel?: string;
  client_documment?: string;
  client_address?: string;
  client_address_city?: string;
  client_address_state?: string;
  client_zip_code?: string;
  // Transaction dates
  trans_createdate: string;
  trans_updatedate: string;
}

export interface BraipProduct {
  product_hash: string;
  name: string;
  description?: string;
  thumbnail?: string;
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
