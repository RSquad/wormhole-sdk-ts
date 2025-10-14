import type { Network, UnsignedTransaction } from "@wormhole-foundation/sdk-connect";
import type { TonChains } from "./types.js";
import type { TonUnsignedMessage } from "./signer.js";
export declare class TonUnsignedTransaction<N extends Network, C extends TonChains> implements UnsignedTransaction<N, C> {
    readonly transaction: TonUnsignedMessage;
    readonly network: N;
    readonly chain: C;
    readonly description: string;
    readonly parallelizable: boolean;
    constructor(transaction: TonUnsignedMessage, network: N, chain: C, description: string, parallelizable?: boolean);
}
//# sourceMappingURL=unsignedTransaction.d.ts.map