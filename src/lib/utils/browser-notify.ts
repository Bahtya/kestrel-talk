import { loadSetting } from './storage';

let permissionGranted = false;

export async function initNotifications(): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    permissionGranted = result === 'granted';
  }
}

export function showNotification(title: string, body: string): void {
  if (loadSetting('notifEnabled', 'true') !== 'true') return;
  if (!permissionGranted) return;
  if (document.hasFocus()) return;
  try {
    new Notification(title, { body, icon: '/favicon.svg', silent: true });
  } catch { /* notification failed */ }
}
