interface ErrorContext {
  userId?: string;
  screen?: string;
  extra?: Record<string, unknown>;
}
type SentryClient = typeof import('@sentry/react');

function stripQueryString(url?: string) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
}

class ErrorTracker {
  private initialized = false;
  private client: SentryClient | null = null;
  private pendingUserId: string | null = null;

  init() {
    if (this.initialized) return;
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn) return;
    void import('@sentry/react').then(client => {
      client.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION || undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0.05,
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
          if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
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
      this.client = client;
      this.initialized = true;
      if (this.pendingUserId) client.setUser({ id: this.pendingUserId });
    }).catch(error => console.warn('[Error tracking] Initialization failed', error));
  }

  setUser(userId: string) {
    this.pendingUserId = userId;
    if (this.initialized) this.client?.setUser({ id: userId });
  }

  clearUser() {
    this.pendingUserId = null;
    if (this.initialized) this.client?.setUser(null);
  }

  captureError(error: Error, context?: ErrorContext) {
    if (!this.initialized) {
      console.error('[Error]', error, context);
      return;
    }
    this.client?.withScope(scope => {
      if (context?.userId) scope.setUser({ id: context.userId });
      if (context?.screen) scope.setTag('screen', context.screen);
      if (context?.extra) {
        for (const [key, value] of Object.entries(context.extra)) scope.setExtra(key, value);
      }
      this.client?.captureException(error);
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (this.initialized) this.client?.captureMessage(message, level);
  }
}

export const errorTracker = new ErrorTracker();
