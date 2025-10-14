import type { Chain, ChainsConfig, Network, SignedTx, StaticPlatformMethods, TxHash } from "@wormhole-foundation/sdk-connect";
import { PlatformContext } from "@wormhole-foundation/sdk-connect";
import { TonClient } from "@ton/ton";
import { TonChain } from "./chain.js";
import type { TonChains, TonPlatformType } from "./types.js";
/**
 * @category Ton
 */
export declare class TonPlatform<N extends Network> extends PlatformContext<N, TonPlatformType> implements StaticPlatformMethods<TonPlatformType, typeof TonPlatform> {
    static _platform: "Ton";
    constructor(network: N, config?: ChainsConfig<N, TonPlatformType>);
    getRpc<C extends TonChains>(chain: C): TonClient;
    getChain<C extends TonChains>(chain: C, _rpc?: TonClient): TonChain<N, C>;
    static isSupportedChain(chain: Chain): boolean;
    static sendWait(_chain: Chain, _rpc: TonClient, _stxns: SignedTx[]): Promise<TxHash[]>;
    static getLatestBlock(rpc: TonClient): Promise<number>;
    static getLatestFinalizedBlock(rpc: TonClient): Promise<number>;
    static chainFromChainId(chainId: string | bigint): [Network, TonChains];
    static chainFromRpc(this: typeof TonPlatform, rpc: TonClient): Promise<[Network, TonChains]>;
    static nativeTokenId<N extends Network, C extends TonChains>(_network: N, chain: C): {
        chain: C;
        address: "native";
    };
    static isNativeTokenId<N extends Network, C extends TonChains>(_network: N, _chain: C, tokenId: any): boolean;
    static getDecimals<C extends TonChains>(network: Network, chain: C, rpc: TonClient, token: any): Promise<number>;
    static getBalance<C extends TonChains>(network: Network, chain: C, rpc: TonClient, walletAddr: string, token: any): Promise<bigint | null>;
}
//# sourceMappingURL=platform.d.ts.map