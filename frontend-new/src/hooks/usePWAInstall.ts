import { useState, useEffect } from 'react';

interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

export const usePWAInstall = (): UsePWAInstallReturn => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(standalone);
    };

    // Check if install prompt is available
    const checkInstallAvailable = () => {
      const hasInstallPrompt = (window as any).pwaInstall && 
        typeof (window as any).pwaInstall === 'function';
      setCanInstall(hasInstallPrompt);
    };

    checkInstalled();
    checkInstallAvailable();

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check periodically for install availability
    const interval = setInterval(() => {
      checkInstallAvailable();
    }, 1000);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  const install = async () => {
    if ((window as any).pwaInstall) {
      await (window as any).pwaInstall();
    }
  };

  return {
    canInstall,
    isInstalled,
    install
  };
};
