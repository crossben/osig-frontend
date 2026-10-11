// Web Push: register the service worker and (on request) subscribe this browser.

import { apiCall } from './api-client';

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Current subscription of this browser, if any */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Ask permission, subscribe, and send the subscription to the API. Returns false if refused. */
export async function enablePush(): Promise<boolean> {
  const reg = await registerServiceWorker();
  if (!reg) return false;
  if ((await Notification.requestPermission()) !== 'granted') return false;
  const { publicKey } = await apiCall<{ publicKey: string }>('GET', '/me/push/key');
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = sub.toJSON();
  await apiCall('POST', '/me/push/subscribe', { endpoint: json.endpoint, keys: json.keys }, { rawBody: true });
  return true;
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await apiCall('DELETE', '/me/push/subscribe', { endpoint: sub.endpoint }, { rawBody: true }).catch(() => undefined);
  await sub.unsubscribe();
}
