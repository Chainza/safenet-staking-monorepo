/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WalletConnect Cloud project id, forwarded to the widget in standalone mode. */
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
