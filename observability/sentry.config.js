// Sentry Configuration - Error Tracking
// Multi-Agent System v7.0 - Enterprise Complete Edition

const Sentry = require('@sentry/node');

function initSentry(options = {}) {
  const {
    dsn = process.env.SENTRY_DSN,
    environment = process.env.NODE_ENV || 'development',
    release = process.env.SERVICE_VERSION || '1.0.0',
    app = null,
    tracesSampleRate = environment === 'production' ? 0.1 : 1.0,
  } = options;

  if (!dsn) {
    console.warn('⚠️  SENTRY_DSN não configurado. Error tracking desabilitado.');
    return null;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
    integrations: [
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event) {
      if (event.request?.url?.includes('/health')) return null;
      const userAgent = event.request?.headers?.['user-agent'] || '';
      if (userAgent.match(/bot|crawler|spider/i)) return null;
      
      // Remover dados sensíveis
      if (event.request?.data) {
        const sensitive = ['password', 'token', 'secret', 'creditCard', 'cpf'];
        for (const field of sensitive) {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        }
      }
      return event;
    },
  });

  if (app) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  console.log(\`✅ Sentry inicializado (\${environment})\`);
  return Sentry;
}

function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return error.status >= 500 || !error.status;
    },
  });
}

function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    if (context.user) scope.setUser(context.user);
    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    if (context.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}

module.exports = { initSentry, sentryErrorHandler, captureError, Sentry };
