import type { PlatformToChains, UniversalOrNative } from "@wormhole-foundation/sdk-connect";
export declare const _platform: "Ton";
export type TonPlatformType = typeof _platform;
export type TonChains = PlatformToChains<TonPlatformType>;
export type UniversalOrTon = UniversalOrNative<TonChains>;
export type AnyTonAddress = UniversalOrTon | string | Uint8Array;
//# sourceMappingURL=types.d.ts.map