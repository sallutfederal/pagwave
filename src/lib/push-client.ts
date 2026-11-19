"use client";

export type DeviceInfo = {
  platform: "ios" | "android" | "desktop";
  deviceLabel: string;
  isStandalone: boolean;
  isIosSafariOutsidePwa: boolean;
  supportsPush: boolean;
};

export function detectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      platform: "desktop",
      deviceLabel: "Desktop",
      isStandalone: false,
      isIosSafariOutsidePwa: false,
      supportsPush: false,
    };
  }

  const ua = navigator.userAgent || "";
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const platform: DeviceInfo["platform"] = isIos
    ? "ios"
    : isAndroid
      ? "android"
      : "desktop";

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const isIosSafariOutsidePwa = isIos && !isStandalone;
  const supportsPush =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const deviceLabel = isIos
    ? /iPad/.test(ua)
      ? "iPad (iOS)"
      : "iPhone (iOS)"
    : isAndroid
      ? "Android"
      : /Mac/i.test(ua)
        ? "Mac / Notebook"
        : /Linux/i.test(ua)
          ? "Linux / Desktop"
          : "PC / Notebook";

  return {
    platform,
    deviceLabel,
    isStandalone,
    isIosSafariOutsidePwa,
    supportsPush,
  };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function getCurrentBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeCurrentDevicePush(publicKey: string) {
  const info = detectDeviceInfo();
  if (!info.supportsPush) {
    throw new Error(
      info.isIosSafariOutsidePwa
        ? "No iPhone/iPad, adicione o PagWave à Tela de Início primeiro para ativar notificações Push."
        : "Este navegador não suporta notificações Web Push.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão de notificações negada no navegador.");
  }

  const reg = await getSwRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Não foi possível obter as chaves Push do navegador.");
  }

  const res = await fetch("/api/notifications/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      keys: { p256dh, auth },
      deviceLabel: info.deviceLabel,
      platform: info.platform,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message || "Falha ao registrar aparelho para Push.");
  }

  return sub;
}

export async function unsubscribeCurrentDevicePush() {
  const sub = await getCurrentBrowserPushSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => false);
  await fetch("/api/notifications/push", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}
