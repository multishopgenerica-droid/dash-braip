// Braip Sale Status Codes
export const SALE_STATUS = {
  AGUARDANDO_PAGAMENTO: 1,
  PAGAMENTO_APROVADO: 2,
  CANCELADA: 3,
  CHARGEBACK: 4,
  DEVOLVIDA: 5,
  EM_ANALISE: 6,
  ESTORNO_PENDENTE: 7,
  EM_PROCESSAMENTO: 8,
  PARCIALMENTE_PAGO: 9,
  PAGAMENTO_ATRASADO: 10,
  AGENDADO: 11,
  FRUSTRADA: 12,
} as const;

export const SALE_STATUS_LABELS: Record<number, string> = {
  1: 'Aguardando Pagamento',
  2: 'Pagamento Aprovado',
  3: 'Cancelada',
  4: 'Chargeback',
  5: 'Devolvida',
  6: 'Em Analise',
  7: 'Estorno Pendente',
  8: 'Em Processamento',
  9: 'Parcialmente Pago',
  10: 'Pagamento Atrasado',
  11: 'Agendado',
  12: 'Frustrada',
};

// Braip Payment Types
export const PAYMENT_TYPE = {
  BOLETO: 1,
  CREDITO: 2,
  PIX: 3,
  AFTER_PAY: 4,
} as const;

export const PAYMENT_TYPE_LABELS: Record<number, string> = {
  1: 'Boleto',
  2: 'Cartao de Credito',
  3: 'PIX',
  4: 'After Pay',
};

// Braip Subscription Status
export const SUBSCRIPTION_STATUS = {
  INICIADA: 1,
  ATIVA: 2,
  ATRASADA: 3,
  CANCELADA_SUPORTE: 4,
  CANCELADA_CLIENTE: 5,
  CANCELADA_VENDEDOR: 6,
  INATIVA: 7,
  VENCIDA: 8,
  CANCELADA_PLATAFORMA: 9,
  AGUARDANDO_PAGAMENTO: 10,
} as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<number, string> = {
  1: 'Iniciada',
  2: 'Ativa',
  3: 'Atrasada',
  4: 'Cancelada pelo Suporte',
  5: 'Cancelada pelo Cliente',
  6: 'Cancelada pelo Vendedor',
  7: 'Inativa',
  8: 'Vencida',
  9: 'Cancelada pela Plataforma',
  10: 'Aguardando Pagamento',
};
