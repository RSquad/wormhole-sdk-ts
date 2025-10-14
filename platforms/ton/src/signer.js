import { encoding } from "@wormhole-foundation/sdk-connect";
import { TonPlatform } from "./platform.js";
import { WalletContractV4, internal, SendMode, Address as TonAddressCore, } from "@ton/ton";
import nacl from "tweetnacl";
import { beginCell } from "@ton/core";
export async function getTonSigner(rpc, privateKeyHex) {
    const [_, chain] = await TonPlatform.chainFromRpc(rpc);
    const ton = rpc;
    const secretKey = encoding.hex.decode(privateKeyHex);
    if (secretKey.length !== 32) {
        throw new Error("TON ed25519 secret key must be 32 bytes");
    }
    const keyPair = nacl.sign.keyPair.fromSeed(secretKey);
    // @ton/ton ожидает Buffer для publicKey
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: Buffer.from(keyPair.publicKey) });
    const opened = ton.open(wallet);
    return new TonSigner(chain, opened, secretKey);
}
export class TonSigner {
    _chain;
    _wallet;
    _secretKey;
    _debug;
    constructor(_chain, _wallet, _secretKey, // ed25519 secret key (32 bytes)
    _debug) {
        this._chain = _chain;
        this._wallet = _wallet;
        this._secretKey = _secretKey;
        this._debug = _debug;
    }
    chain() {
        return this._chain;
    }
    address() {
        return this._wallet.address.toString();
    }
    async signAndSend(txs) {
        const txhashes = [];
        for (const utx of txs) {
            const { description, transaction } = utx;
            if (this._debug)
                console.log(`Signing: ${description} for ${this.address()}`);
            //InternalMessage
            const toAddr = typeof transaction.to === "string"
                ? TonAddressCore.parse(transaction.to)
                : transaction.to;
            const body = transaction.body ?? beginCell().endCell();
            const bounce = transaction.bounce ?? true;
            const seqno = await this._wallet.getSeqno();
            await this._wallet.sendTransfer({
                secretKey: Buffer.from(this._secretKey),
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
            txhashes.push(`${this.address()}:${seqno}`);
            if (this._debug)
                console.log(`Submitted: ${description} => ${txhashes.at(-1)}`);
        }
        return txhashes;
    }
}
//# sourceMappingURL=signer.js.map