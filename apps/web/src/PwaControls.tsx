import { useEffect, useRef, useState } from "react";
import { resolvePublicAssetUrl } from "./runtime/config";

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

export function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const reloadRequested = useRef(false);

  useEffect(() => {
    const offerInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    const updateConnection = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", offerInstall);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("beforeinstallprompt", offerInstall);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const serviceWorker = navigator.serviceWorker;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let lastUpdateCheck = Date.now();
    const showUpdate = () => {
      if (!disposed && registration?.waiting && serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
      }
    };
    const trackInstall = () => {
      installing?.removeEventListener("statechange", showUpdate);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", showUpdate);
    };
    const checkUpdate = () => {
      if (navigator.onLine && Date.now() - lastUpdateCheck >= 3_600_000) {
        lastUpdateCheck = Date.now();
        void registration?.update().catch(() => undefined);
      }
    };
    const reload = () => {
      if (reloadRequested.current) window.location.reload();
    };
    const register = () => {
      void serviceWorker.register(resolvePublicAssetUrl("sw.js"), {
        scope: resolvePublicAssetUrl(""), updateViaCache: "none",
      }).then((value) => {
        if (disposed) return;
        registration = value;
        showUpdate();
        trackInstall();
        registration.addEventListener("updatefound", trackInstall);
      }).catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    serviceWorker.addEventListener("controllerchange", reload);
    window.addEventListener("focus", checkUpdate);
    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      window.removeEventListener("focus", checkUpdate);
      serviceWorker.removeEventListener("controllerchange", reload);
      registration?.removeEventListener("updatefound", trackInstall);
      installing?.removeEventListener("statechange", showUpdate);
    };
  }, []);

  if (!offline && !installPrompt && !waitingWorker) return null;
  return <div className="pwa-actions">
    {offline ? <span role="status">离线浏览 · 显示上次缓存的内容</span> : null}
    {installPrompt ? <button className="button button--outline" type="button" onClick={() => {
      const prompt = installPrompt;
      setInstallPrompt(null);
      void prompt.prompt().catch(() => undefined);
    }}>安装应用 <span aria-hidden="true">↗</span></button> : null}
    {waitingWorker ? <button className="button button--outline" type="button" onClick={() => {
      reloadRequested.current = true;
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }}>更新应用 <span aria-hidden="true">↻</span></button> : null}
  </div>;
}
