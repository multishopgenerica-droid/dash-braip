import api from './api';

// Types
export interface Expense {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  amount: number;
  dueDate?: string;
  paidAt?: string;
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  salary: number;
  bonus: number;
  benefits: number;
  startDate: string;
  endDate?: string;
  paymentDay: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: ToolCategory;
  monthlyCost: number;
  annualCost?: number;
  recurrence: RecurrenceType;
  billingDate?: string;
  isActive: boolean;
  loginUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrafficSpend {
  id: string;
  userId: string;
  platform: TrafficPlatform;
  campaignName?: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export type ExpenseCategory =
  | 'MARKETING'
  | 'OPERACIONAL'
  | 'TECNOLOGIA'
  | 'RECURSOS_HUMANOS'
  | 'TRAFEGO'
  | 'INFRAESTRUTURA'
  | 'OUTROS';

export type ExpenseStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'VENCIDO';

export type RecurrenceType =
  | 'UNICO'
  | 'DIARIO'
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type EmployeeRole =
  | 'GESTOR_TRAFEGO'
  | 'COPYWRITER'
  | 'DESIGNER'
  | 'SUPORTE'
  | 'DESENVOLVEDOR'
  | 'ADMINISTRATIVO'
  | 'VENDEDOR'
  | 'GERENTE'
  | 'OUTROS';

export type EmployeeStatus = 'ATIVO' | 'INATIVO' | 'FERIAS' | 'AFASTADO';

export type ToolCategory =
  | 'AUTOMACAO'
  | 'EMAIL_MARKETING'
  | 'CRM'
  | 'DESIGN'
  | 'VIDEO'
  | 'HOSPEDAGEM'
  | 'ANALYTICS'
  | 'COMUNICACAO'
  | 'GESTAO_PROJETOS'
  | 'PAGAMENTOS'
  | 'OUTROS';

export type TrafficPlatform =
  | 'META_ADS'
  | 'GOOGLE_ADS'
  | 'TIKTOK_ADS'
  | 'YOUTUBE_ADS'
  | 'NATIVE_ADS'
  | 'PINTEREST_ADS'
  | 'LINKEDIN_ADS'
  | 'TWITTER_ADS'
  | 'OUTROS';

// Labels
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MARKETING: 'Marketing',
  OPERACIONAL: 'Operacional',
  TECNOLOGIA: 'Tecnologia',
  RECURSOS_HUMANOS: 'Recursos Humanos',
  TRAFEGO: 'Tráfego',
  INFRAESTRUTURA: 'Infraestrutura',
  OUTROS: 'Outros',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  VENCIDO: 'Vencido',
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  UNICO: 'Único',
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  GESTOR_TRAFEGO: 'Gestor de Tráfego',
  COPYWRITER: 'Copywriter',
  DESIGNER: 'Designer',
  SUPORTE: 'Suporte',
  DESENVOLVEDOR: 'Desenvolvedor',
  ADMINISTRATIVO: 'Administrativo',
  VENDEDOR: 'Vendedor',
  GERENTE: 'Gerente',
  OUTROS: 'Outros',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FERIAS: 'Férias',
  AFASTADO: 'Afastado',
};

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  AUTOMACAO: 'Automação',
  EMAIL_MARKETING: 'E-mail Marketing',
  CRM: 'CRM',
  DESIGN: 'Design',
  VIDEO: 'Vídeo',
  HOSPEDAGEM: 'Hospedagem',
  ANALYTICS: 'Analytics',
  COMUNICACAO: 'Comunicação',
  GESTAO_PROJETOS: 'Gestão de Projetos',
  PAGAMENTOS: 'Pagamentos',
  OUTROS: 'Outros',
};

export const TRAFFIC_PLATFORM_LABELS: Record<TrafficPlatform, string> = {
  META_ADS: 'Meta Ads',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK_ADS: 'TikTok Ads',
  YOUTUBE_ADS: 'YouTube Ads',
  NATIVE_ADS: 'Native Ads',
  PINTEREST_ADS: 'Pinterest Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  TWITTER_ADS: 'Twitter Ads',
  OUTROS: 'Outros',
};

// Pagination interface
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard interfaces
export interface MacroView {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    sales: number;
    trafficRevenue: number;
    total: number;
  };
  costs: {
    expenses: number;
    payroll: number;
    tools: number;
    traffic: number;
    total: number;
  };
  profit: {
    net: number;
    margin: string;
  };
  breakdown: {
    expensesByCategory: Array<{ category: string; total: number }>;
    employeesByRole: Array<{ role: string; count: number; totalSalary: number }>;
    toolsByCategory: Array<{ category: string; count: number; totalCost: number }>;
    trafficByPlatform: Array<{
      platform: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      roas: string;
    }>;
  };
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  traffic: number;
  profit: number;
}

export interface SummaryCards {
  activeEmployees: number;
  activeTools: number;
  pendingExpenses: number;
  monthlyTrafficSpend: number;
}

// Financial Service
export const financialService = {
  // Dashboard
  getMacroView: async (startDate?: string, endDate?: string): Promise<MacroView> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/financial/dashboard/macro${query}`);
    return response.data;
  },

  getMonthlyTrend: async (months = 6): Promise<MonthlyTrend[]> => {
    const response = await api.get(`/api/financial/dashboard/trend?months=${months}`);
    return response.data;
  },

  getSummaryCards: async (startDate?: string, endDate?: string): Promise<SummaryCards> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/financial/dashboard/summary${query}`);
    return response.data;
  },

  generateReport: async (options: {
    type: 'summary' | 'detailed' | 'expenses' | 'traffic';
    startDate?: string;
    endDate?: string;
    format: 'csv' | 'json';
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append('type', options.type);
    params.append('format', options.format);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    const response = await api.get(`/api/financial/reports/generate?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Expenses
  listExpenses: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get('/api/financial/expenses', { params });
    return response.data;
  },

  getExpense: async (id: string): Promise<Expense> => {
    const response = await api.get(`/api/financial/expenses/${id}`);
    return response.data;
  },

  createExpense: async (data: Partial<Expense>): Promise<Expense> => {
    const response = await api.post('/api/financial/expenses', data);
    return response.data;
  },

  updateExpense: async (id: string, data: Partial<Expense>): Promise<Expense> => {
    const response = await api.patch(`/api/financial/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/api/financial/expenses/${id}`);
  },

  // Employees
  listEmployees: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<Employee>> => {
    const response = await api.get('/api/financial/employees', { params });
    return response.data;
  },

  getEmployee: async (id: string): Promise<Employee> => {
    const response = await api.get(`/api/financial/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await api.post('/api/financial/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await api.put(`/api/financial/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/api/financial/employees/${id}`);
  },

  getPayroll: async (): Promise<{ salaries: number; bonuses: number; benefits: number; total: number }> => {
    const response = await api.get('/api/financial/employees/payroll');
    return response.data;
  },

  // Tools
  listTools: async (params: Record<string, string | number | boolean> = {}): Promise<PaginatedResponse<Tool>> => {
    const response = await api.get('/api/financial/tools', { params });
    return response.data;
  },

  getTool: async (id: string): Promise<Tool> => {
    const response = await api.get(`/api/financial/tools/${id}`);
    return response.data;
  },

  createTool: async (data: Partial<Tool>): Promise<Tool> => {
    const response = await api.post('/api/financial/tools', data);
    return response.data;
  },

  updateTool: async (id: string, data: Partial<Tool>): Promise<Tool> => {
    const response = await api.put(`/api/financial/tools/${id}`, data);
    return response.data;
  },

  deleteTool: async (id: string): Promise<void> => {
    await api.delete(`/api/financial/tools/${id}`);
  },

  getToolsCost: async (): Promise<{ monthlyCost: number }> => {
    const response = await api.get('/api/financial/tools/cost');
    return response.data;
  },

  // Traffic
  listTraffic: async (params: Record<string, string | number> = {}): Promise<PaginatedResponse<TrafficSpend>> => {
    const response = await api.get('/api/financial/traffic', { params });
    return response.data;
  },

  getTraffic: async (id: string): Promise<TrafficSpend> => {
    const response = await api.get(`/api/financial/traffic/${id}`);
    return response.data;
  },

  createTraffic: async (data: Partial<TrafficSpend>): Promise<TrafficSpend> => {
    const response = await api.post('/api/financial/traffic', data);
    return response.data;
  },

  updateTraffic: async (id: string, data: Partial<TrafficSpend>): Promise<TrafficSpend> => {
    const response = await api.put(`/api/financial/traffic/${id}`, data);
    return response.data;
  },

  deleteTraffic: async (id: string): Promise<void> => {
    await api.delete(`/api/financial/traffic/${id}`);
  },

  getTrafficByPlatform: async (
    startDate?: string,
    endDate?: string
  ): Promise<
    Array<{
      platform: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
      roas: string;
    }>
  > => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/financial/traffic/platforms${query}`);
    return response.data;
  },
};

// Helper to format currency (cents to BRL)
export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
};

export default financialService;
