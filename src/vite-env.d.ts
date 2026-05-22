/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDIA_BASE?: string;
  readonly VITE_AUDIO_PROXY_BASE?: string;
  readonly VITE_YM_COUNTER_ID?: string;
  readonly VITE_SITE_ORIGIN?: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
