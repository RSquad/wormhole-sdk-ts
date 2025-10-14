import type { Address as WHAddress } from "@wormhole-foundation/sdk-connect";
import { UniversalAddress } from "@wormhole-foundation/sdk-connect";
export declare function normalizeTonTo32Bytes(addr: string | Uint8Array | TonAddress | UniversalAddress): Uint8Array;
export declare class TonAddress implements WHAddress {
    static readonly byteSize = 32;
    static readonly platform: "Ton";
    readonly type: string;
    readonly address: Uint8Array;
    constructor(address: string | Uint8Array | TonAddress | UniversalAddress);
    unwrap(): string;
    toString(): string;
    toNative(): this;
    toUint8Array(): Uint8Array;
    toUniversalAddress(): UniversalAddress;
    static instanceof(address: any): address is TonAddress;
    equals(other: TonAddress | UniversalAddress): boolean;
}
declare module "@wormhole-foundation/sdk-connect" {
    namespace WormholeRegistry {
        interface PlatformToNativeAddressMapping {
            Ton: TonAddress;
        }
    }
}
//# sourceMappingURL=address.d.ts.map