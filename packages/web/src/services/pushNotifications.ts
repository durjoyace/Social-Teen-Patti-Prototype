/**
 * PUSH NOTIFICATION SERVICE
 *
 * Web Push API for browsers. Capacitor support when native SDK is installed.
 * No npm imports — uses only browser-native APIs.
 *
 * To activate: set VITE_VAPID_PUBLIC_KEY in .env
 */

class PushNotificationService {
  private registered = false;
  private permission: NotificationPermission = 'default';

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;

    this.permission = Notification.permission;
    if (this.permission === 'granted') this.registered = true;

    return this.registered;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    const result = await Notification.requestPermission();
    this.permission = result;

    if (result === 'granted') {
      this.registered = true;
      await this.registerServiceWorker();
      return true;
    }
    return false;
  }

  private async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiUrl}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      }).catch(() => {});
    } catch {
      // Service worker not supported or failed
    }
  }

  showLocalNotification(title: string, body: string, tag?: string) {
    if (this.permission !== 'granted') return;
    new Notification(title, { body, icon: '/icon.svg', tag: tag || 'general' });
  }

  get isRegistered() { return this.registered; }
  get currentPermission() { return this.permission; }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const bytes = new Uint8Array(rawData.length);
    for (let index = 0; index < rawData.length; index += 1) bytes[index] = rawData.charCodeAt(index);
    return bytes.buffer;
  }
}

export const pushNotifications = new PushNotificationService();
