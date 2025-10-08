import type { Network } from "@wormhole-foundation/sdk-connect";
import { ChainContext } from "@wormhole-foundation/sdk-connect";
import type { TonChains } from "./types.js";

export class TonChain<
  N extends Network = Network,
  C extends TonChains = TonChains,
> extends ChainContext<N, C> {}
