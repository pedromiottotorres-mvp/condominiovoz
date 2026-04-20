'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface InstallContextType {
  deferredPrompt: any;
  installed: boolean;
  triggerInstall: () => Promise<void>;
}

const InstallContext = createContext<InstallContextType>({
  deferredPrompt: null,
  installed: false,
  triggerInstall: async () => {},
});

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <InstallContext.Provider value={{ deferredPrompt, installed, triggerInstall }}>
      {children}
    </InstallContext.Provider>
  );
}

export const useInstall = () => useContext(InstallContext);
