export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha invalidos',
  TOKEN_NOT_PROVIDED: 'Token de acesso nao fornecido',
  TOKEN_INVALID: 'Token invalido ou expirado',
  TOKEN_EXPIRED: 'Token expirado',
  USER_NOT_FOUND: 'Usuario nao encontrado',
  USER_INACTIVE: 'Usuario inativo',
  EMAIL_ALREADY_EXISTS: 'Email ja cadastrado',
  PASSWORD_MISMATCH: 'Senhas nao conferem',
  UNAUTHORIZED: 'Acesso nao autorizado',
  FORBIDDEN: 'Acesso negado',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  PASSWORD_CHANGED: 'Senha alterada com sucesso',
} as const;

export const GATEWAY_MESSAGES = {
  NOT_FOUND: 'Gateway nao encontrado',
  ALREADY_EXISTS: 'Gateway ja configurado para este usuario',
  INVALID_TOKEN: 'Token de API invalido',
  CONNECTION_ERROR: 'Erro ao conectar com o gateway',
  SYNC_STARTED: 'Sincronizacao iniciada',
  SYNC_COMPLETED: 'Sincronizacao concluida',
  SYNC_ERROR: 'Erro durante a sincronizacao',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Campo obrigatorio',
  INVALID_EMAIL: 'Email invalido',
  INVALID_PASSWORD: 'Senha deve ter no minimo 8 caracteres',
  INVALID_ID: 'ID invalido',
  INVALID_DATE: 'Data invalida',
  INVALID_PAGE: 'Pagina invalida',
} as const;

export const GENERAL_MESSAGES = {
  INTERNAL_ERROR: 'Erro interno do servidor',
  NOT_FOUND: 'Recurso nao encontrado',
  BAD_REQUEST: 'Requisicao invalida',
  RATE_LIMIT: 'Muitas requisicoes. Tente novamente mais tarde.',
} as const;
