import type {
  Chain,
  ChainsConfig,
  Network,
  SignedTx,
  StaticPlatformMethods,
  TxHash,
} from "@wormhole-foundation/sdk-connect";
import {
  PlatformContext,
  chainToPlatform,
  nativeChainIds,
  networkPlatformConfigs,
} from "@wormhole-foundation/sdk-connect";

import { TonClient } from "@ton/ton";
import { TonChain } from "./chain.js";
import type { TonChains, TonPlatformType } from "./types.js";
import { _platform } from "./types.js";

/**
 * @category Ton
 */
export class TonPlatform<N extends Network>
    extends PlatformContext<N, TonPlatformType>
    implements StaticPlatformMethods<TonPlatformType, typeof TonPlatform> {
  static _platform = _platform;

  constructor(network: N, config?: ChainsConfig<N, TonPlatformType>) {
    super(network, config ?? networkPlatformConfigs(network, TonPlatform._platform));
  }

  getRpc<C extends TonChains>(chain: C): TonClient {
    if (chain in this.config) {
      const endpoint = this.config[chain]!.rpc;
      if (!endpoint) throw new Error(`Empty TON RPC endpoint for chain ${String(chain)}`);
      return new TonClient({endpoint});
    }
    throw new Error("No configuration available for chain: " + chain);
  }

  getChain<C extends TonChains>(chain: C, _rpc?: TonClient): TonChain<N, C> {
    if (chain in this.config) return new TonChain(chain, this);
    throw new Error("No configuration available for chain: " + chain);
  }

  static isSupportedChain(chain: Chain): boolean {
    const platform = chainToPlatform(chain);
    return platform === TonPlatform._platform;
  }

  static async sendWait(_chain: Chain, _rpc: TonClient, _stxns: SignedTx[]): Promise<TxHash[]> {
    throw new Error(
        "TonPlatform.sendWait is not supported. Use signer.signAndSend for TON transactions.",
    );
  }

  static async getLatestBlock(rpc: TonClient): Promise<number> {
    const info = await rpc.getMasterchainInfo();
    return Number(info.latestSeqno);
  }

  static async getLatestFinalizedBlock(rpc: TonClient): Promise<number> {
    const info = await rpc.getMasterchainInfo();
    return Number(info.latestSeqno);
  }

  static chainFromChainId(chainId: string | bigint): [Network, TonChains] {
    const idAsBigInt =
        typeof chainId === "bigint"
            ? chainId
            : (() => {
              try {
                return BigInt(chainId);
              } catch {
                throw new Error(
                    `TON has no numeric chainId via RPC; cannot map arbitrary id "${chainId}"`,
                );
              }
            })();

    const netChain = nativeChainIds.platformNativeChainIdToNetworkChain(
        TonPlatform._platform,
        idAsBigInt,
    );

    if (!netChain)
      throw new Error(`No matching chainId to determine network and chain: ${String(chainId)}`);

    const [network, chain] = netChain;
    return [network, chain];
  }

  static async chainFromRpc(this: typeof TonPlatform, rpc: TonClient): Promise<[Network, TonChains]> {
    const url = (rpc as any)?.endpoint as string | undefined;
    if (url && /test|sandbox|toncenter.*test/i.test(url)) {
      return ["Testnet" as Network, "Ton" as TonChains];
    }
    await rpc.getMasterchainInfo();
    return ["Mainnet" as Network, "Ton" as TonChains];
  }
}