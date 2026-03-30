declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    onOfflineReady?(): void;
    onNeedRefresh?(): void;
    onRegisteredSW?(swUrl: string, registration: ServiceWorkerRegistration | undefined): void;
    onRegisterError?(error: any): void;
  }

  export function registerSW(options: RegisterSWOptions): (reloadPage?: boolean) => void;
}
