/**
 * Single source of truth for the chains the widget supports. Import chains from
 * here — never directly from `wagmi/chains` — so the supported set lives in one
 * place (standalone config, tests, and any future chain logic stay in sync).
 */
export { mainnet } from "wagmi/chains";

/** Mainnet RPC for the widget's own clients (standalone config, test harness).
 *  wagmi/viem's built-in default public RPC is unreliable — don't use bare `http()`. */
export const mainnetRpcUrl = "https://eth.blockrazor.xyz";
