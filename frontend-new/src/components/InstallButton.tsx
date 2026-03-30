import { useState, useEffect } from 'react';

interface InstallButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const InstallButton = ({ className = '', children }: InstallButtonProps) => {
  const [installAvailable, setInstallAvailable] = useState(false);

  useEffect(() => {
    // Check if install prompt is available
    const checkInstallAvailable = () => {
      // Check if the global function exists and if deferredPrompt is available
      const hasInstallPrompt = (window as any).pwaInstall && 
        typeof (window as any).pwaInstall === 'function';
      setInstallAvailable(hasInstallPrompt);
    };

    // Check immediately and then periodically
    checkInstallAvailable();
    const interval = setInterval(checkInstallAvailable, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    try {
      await (window as any).pwaInstall();
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  if (!installAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className={`pwa-install-button ${className}`}
      style={{
        padding: '8px 16px',
        backgroundColor: '#0f172a',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      {children || 'Install App'}
    </button>
  );
};

export default InstallButton;
