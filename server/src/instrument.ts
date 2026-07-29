import * as Sentry from '@sentry/node';
import { env } from './config/env.js';

function stripQueryString(url?: string) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

Sentry.init({
  dsn: env.sentryDsn || undefined,
  enabled: Boolean(env.sentryDsn),
  environment: env.nodeEnv,
  release: env.appVersion === 'dev' ? undefined : env.appVersion,
  sendDefaultPii: false,
  tracesSampleRate: env.sentryTracesSampleRate,
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data) {
      for (const key of ['url', 'from', 'to']) {
        if (typeof breadcrumb.data[key] === 'string') {
          breadcrumb.data[key] = stripQueryString(breadcrumb.data[key]);
        }
      }
    }
    return breadcrumb;
  },
  beforeSend(event) {
    if (event.user) {
      event.user = event.user.id ? { id: event.user.id } : undefined;
    }
    if (event.request) {
      event.request.url = stripQueryString(event.request.url);
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.query_string;
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.Authorization;
        delete event.request.headers.cookie;
        delete event.request.headers.Cookie;
      }
    }
    return event;
  },
});

export function captureException(error: unknown, context?: Record<string, string>) {
  if (!env.sentryDsn) return;
  Sentry.withScope(scope => {
    if (context) {
      for (const [key, value] of Object.entries(context)) scope.setTag(key, value);
    }
    Sentry.captureException(error);
  });
}

export async function flushErrorTelemetry(timeoutMs = 2_000) {
  if (!env.sentryDsn) return true;
  return Sentry.flush(timeoutMs);
}
