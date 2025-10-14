import { PlatformContext, chainToPlatform, decimals, isNative, nativeChainIds, networkPlatformConfigs, } from "@wormhole-foundation/sdk-connect";
import { TonClient } from "@ton/ton";
import { TonChain } from "./chain.js";
import { _platform } from "./types.js";
/**
 * @category Ton
 */
export class TonPlatform extends PlatformContext {
    static _platform = _platform;
    constructor(network, config) {
        super(network, config ?? networkPlatformConfigs(network, TonPlatform._platform));
    }
    getRpc(chain) {
        if (chain in this.config) {
            const endpoint = this.config[chain].rpc;
            if (!endpoint)
                throw new Error(`Empty TON RPC endpoint for chain ${String(chain)}`);
            return new TonClient({ endpoint });
        }
        throw new Error("No configuration available for chain: " + chain);
    }
    getChain(chain, _rpc) {
        if (chain in this.config)
            return new TonChain(chain, this);
        throw new Error("No configuration available for chain: " + chain);
    }
    static isSupportedChain(chain) {
        const platform = chainToPlatform(chain);
        return platform === TonPlatform._platform;
    }
    static async sendWait(_chain, _rpc, _stxns) {
        throw new Error("TonPlatform.sendWait is not supported. Use signer.signAndSend for TON transactions.");
    }
    static async getLatestBlock(rpc) {
        const info = await rpc.getMasterchainInfo();
        return Number(info.latestSeqno);
    }
    static async getLatestFinalizedBlock(rpc) {
        // В TON финальность отличается; используем latestSeqno как аппроксимацию
        const info = await rpc.getMasterchainInfo();
        return Number(info.latestSeqno);
    }
    static chainFromChainId(chainId) {
        const idAsBigInt = typeof chainId === "bigint"
            ? chainId
            : (() => {
                try {
                    return BigInt(chainId);
                }
                catch {
                    throw new Error(`TON has no numeric chainId via RPC; cannot map arbitrary id "${chainId}"`);
                }
            })();
        const netChain = nativeChainIds.platformNativeChainIdToNetworkChain(TonPlatform._platform, idAsBigInt);
        if (!netChain)
            throw new Error(`No matching chainId to determine network and chain: ${String(chainId)}`);
        const [network, chain] = netChain;
        return [network, chain];
    }
    static async chainFromRpc(rpc) {
        const url = rpc?.endpoint;
        // Простейшее определение сети на основе endpoint; при необходимости дополним rpc-вызовом
        if (url && /test|sandbox|toncenter.*test/i.test(url)) {
            return ["Testnet", "Ton"];
        }
        // Проверочный вызов, чтобы убедиться что RPC доступен
        await rpc.getMasterchainInfo();
        return ["Mainnet", "Ton"];
    }
    static nativeTokenId(_network, chain) {
        return { chain, address: "native" };
    }
    static isNativeTokenId(_network, _chain, tokenId) {
        return tokenId?.address === "native";
    }
    static async getDecimals(network, chain, rpc, token) {
        if (isNative(token))
            return decimals.nativeDecimals(TonPlatform._platform);
        // Для токенов Jetton потребуется реализация; пока кидаем
        throw new Error("Jetton decimals not implemented");
    }
    static async getBalance(network, chain, rpc, walletAddr, token) {
        if (isNative(token))
            return null; // Требуется отдельная реализация для балансов TON
        return null;
    }
}
//# sourceMappingURL=platform.js.map