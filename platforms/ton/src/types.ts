import type { PlatformToChains, UniversalOrNative } from "@wormhole-foundation/sdk-connect";

export const _platform: "Ton" = "Ton";
export type TonPlatformType = typeof _platform;
export type TonChains = PlatformToChains<TonPlatformType>;
export type UniversalOrTon = UniversalOrNative<TonChains>;
export type AnyTonAddress = UniversalOrTon | string | Uint8Array;


