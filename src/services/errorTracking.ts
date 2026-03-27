/**
 * ERROR TRACKING SERVICE
 *
 * Sentry integration via script tag (not npm import).
 * Falls back to console when Sentry isn't loaded.
 *
 * To activate: add Sentry browser SDK script tag to index.html
 * and set VITE_SENTRY_DSN in .env
 */

interface ErrorContext {
  userId?: string;
  screen?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private sentry: any = null;

  init() {
    this.sentry = (window as any).Sentry || null;

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (dsn && this.sentry?.init) {
      this.sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
    }
  }

  setUser(userId: string, username: string) {
    this.sentry?.setUser?.({ id: userId, username });
  }

  clearUser() {
    this.sentry?.setUser?.(null);
  }

  captureError(error: Error, context?: ErrorContext) {
    if (this.sentry?.captureException) {
      this.sentry.withScope((scope: any) => {
        if (context?.userId) scope.setUser({ id: context.userId });
        if (context?.screen) scope.setTag('screen', context.screen);
        if (context?.extra) {
          Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
        }
        this.sentry.captureException(error);
      });
    } else {
      console.error('[Error]', error, context);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    this.sentry?.captureMessage?.(message, level);
  }
}

export const errorTracker = new ErrorTracker();
