import { Toaster } from 'react-hot-toast'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { registerSW } from 'virtual:pwa-register'
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// GLOBAL ERROR TRAP - Log all runtime errors
window.onerror = function (message, source, lineno, colno, error) {
  console.error("🚨 GLOBAL ERROR:", message, "at", source, `line ${lineno}:${colno}`, error);
};

window.onunhandledrejection = function (event) {
  console.error("🚨 UNHANDLED PROMISE REJECTION:", event.reason);
};

// PWA Install Prompt Handler
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  console.log('PWA install prompt available - use window.pwaInstall() to trigger install');
});

// Global function to trigger PWA install
(window as unknown as { pwaInstall: () => Promise<void> }).pwaInstall = async () => {
  if (!deferredPrompt) {
    console.log('PWA install prompt not available');
    return;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to install prompt: ${outcome}`);
  deferredPrompt = null;
};

// Listen for successful PWA installation
window.addEventListener('appinstalled', () => {
  console.log('PWA was successfully installed');
  deferredPrompt = null;
});

// Register PWA service worker
const updateSW = registerSW({
  onOfflineReady(): void {
    console.log('App ready to work offline');
  },
  onNeedRefresh(): void {
    console.log('New content available, please refresh');
    updateSW(true);
  },
onRegisteredSW(swUrl: string, _registration?: ServiceWorkerRegistration): void {
  console.log('Service Worker registered at:', swUrl, _registration);
},
onRegisterError(error: unknown): void {
  console.error('Service Worker registration failed:', error);
}
}); 

// Initialize dark mode before rendering
if (
  localStorage.getItem("safeyatra-theme") === "dark" ||
  (!localStorage.getItem("safeyatra-theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
     <Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#1f2937',
      color: '#fff',
      borderRadius: '10px',
      padding: '12px 16px',
    },
  }}
/>
    </AuthProvider>
  </StrictMode>,
)
