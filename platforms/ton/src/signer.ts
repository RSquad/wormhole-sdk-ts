import type {
  Network,
  RpcConnection,
  SignAndSendSigner,
  Signer,
  TxHash,
  UnsignedTransaction,
} from "@wormhole-foundation/sdk-connect";
import { encoding } from "@wormhole-foundation/sdk-connect";

import { TonPlatform } from "./platform.js";
import type { TonChains } from "./types.js";

import {
  WalletContractV4,
  internal,
  SendMode,
  Address as TonAddressCore,
} from "@ton/ton";
import type { TonClient,OpenedContract } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { beginCell } from "@ton/core";
import type {Cell } from "@ton/core";

export type TonUnsignedMessage = {
  to: string | TonAddressCore;
  value: bigint;        // nanotons
  body?: Cell;
  bounce?: boolean;     // default true
  stateInit?: Cell;
};

export async function getTonSigner(
    rpc: RpcConnection<"Ton">,
    privateKeyHex: string,
): Promise<Signer> {
  const [_, chain] = await TonPlatform.chainFromRpc(rpc as unknown as TonClient);

  const ton = rpc as unknown as TonClient;

  const secretKey = encoding.hex.decode(privateKeyHex);

  const { publicKey } = await mnemonicToPrivateKey([]).catch(() => {
    throw new Error(
        "Provide ed25519 publicKey for TON wallet, or switch to mnemonics + mnemonicToPrivateKey",
    );
  });

  const wallet = WalletContractV4.create({ workchain: 0, publicKey });
  const opened: OpenedContract<WalletContractV4> = ton.open(wallet);

  return new TonSigner(chain as TonChains, opened, secretKey, ton);
}

export class TonSigner<N extends Network, C extends TonChains>
    implements SignAndSendSigner<N, C>
{
  constructor(
      private _chain: C,
      private _wallet: OpenedContract<WalletContractV4>,
      private _secretKey: Uint8Array,     // ed25519 secret key (32 bytes)
      private _rpc: TonClient,
      private _debug?: boolean,
  ) {}

  chain() {
    return this._chain;
  }

  address(): string {
    return this._wallet.address.toString();
  }

  async signAndSend(txs: UnsignedTransaction[]): Promise<TxHash[]> {
    const txhashes: TxHash[] = [];

    for (const utx of txs) {
      const { description, transaction } = utx as unknown as {
        description: string;
        transaction: TonUnsignedMessage;
      };

      if (this._debug) console.log(`Signing: ${description} for ${this.address()}`);

      //InternalMessage
      const toAddr =
          typeof transaction.to === "string"
              ? TonAddressCore.parse(transaction.to)
              : transaction.to;

      const body = transaction.body ?? beginCell().endCell();
      const bounce = transaction.bounce ?? true;

      const seqno = await this._wallet.getSeqno();

      await this._wallet.sendTransfer({
        secretKey: this._secretKey,
        seqno,
        messages: [
          internal({
            to: toAddr,
            value: transaction.value,
            body,
            bounce,
          }),
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
      });

      txhashes.push(`${this.address()}:${seqno}` as TxHash);

      if (this._debug) console.log(`Submitted: ${description} => ${txhashes.at(-1)}`);
    }

    return txhashes;
  }
}
