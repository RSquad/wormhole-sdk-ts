import type { Network, RpcConnection, SignAndSendSigner, Signer, TxHash, UnsignedTransaction } from "@wormhole-foundation/sdk-connect";
import type { TonChains } from "./types.js";
import { WalletContractV4, Address as TonAddressCore } from "@ton/ton";
import type { OpenedContract } from "@ton/ton";
import type { Cell } from "@ton/core";
export type TonUnsignedMessage = {
    to: string | TonAddressCore;
    value: bigint;
    body?: Cell;
    bounce?: boolean;
    stateInit?: Cell;
};
export declare function getTonSigner(rpc: RpcConnection<"Ton">, privateKeyHex: string): Promise<Signer>;
export declare class TonSigner<N extends Network, C extends TonChains> implements SignAndSendSigner<N, C> {
    private _chain;
    private _wallet;
    private _secretKey;
    private _debug?;
    constructor(_chain: C, _wallet: OpenedContract<WalletContractV4>, _secretKey: Uint8Array, // ed25519 secret key (32 bytes)
    _debug?: boolean | undefined);
    chain(): C;
    address(): string;
    signAndSend(txs: UnsignedTransaction[]): Promise<TxHash[]>;
}
//# sourceMappingURL=signer.d.ts.map