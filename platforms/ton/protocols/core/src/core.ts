import type {
  ChainId,
  ChainsConfig,
  Contracts,
  Network,
  VAA,
  WormholeCore,
  WormholeMessageId,
} from "@wormhole-foundation/sdk-connect";
import { UniversalAddress, createVAA, serialize, toChainId } from "@wormhole-foundation/sdk-connect";

import type { AnyTonAddress, TonChains, TonPlatformType } from "@wormhole-foundation/sdk-ton";
import { normalizeTonTo32Bytes } from "@wormhole-foundation/sdk-ton";
import { TonPlatform } from "@wormhole-foundation/sdk-ton";

import type { TonClient } from "@ton/ton";
import { beginCell, Address as TonCoreAddress, Cell } from "@ton/core";
import { TonUnsignedTransaction } from "@wormhole-foundation/sdk-ton";

export class TonWormholeCore<N extends Network, C extends TonChains>
    implements WormholeCore<N, C>
{
  readonly chainId: ChainId;
  readonly coreBridge: string;

  constructor(
      readonly network: N,
      readonly chain: C,
      readonly connection: TonClient,
      readonly contracts: Contracts,
  ) {
    this.chainId = toChainId(chain);
    const coreBridgeAddress = contracts.coreBridge;
    if (!coreBridgeAddress)
      throw new Error(`CoreBridge contract Address for chain ${chain} not found`);
    this.coreBridge = coreBridgeAddress;
  }

  async getMessageFee(): Promise<bigint> {
    return 0n;
  }

  getGuardianSet(_index: number): Promise<WormholeCore.GuardianSet> {
    throw new Error("Method not implemented.");
  }

  getGuardianSetIndex(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  static async fromRpc<N extends Network>(
      connection: TonClient,
      config: ChainsConfig<N, TonPlatformType>,
  ): Promise<TonWormholeCore<N, TonChains>> {
    const [network, chain] = await TonPlatform.chainFromRpc(connection);
    const conf = config[chain]!;
    if (conf.network !== network)
      throw new Error(`Network mismatch: ${conf.network} !== ${network}`);
    return new TonWormholeCore(network as N, chain, connection, conf.contracts);
  }

  async *publishMessage(
      _sender: AnyTonAddress,
      _message: string | Uint8Array,
      _nonce: number,
      _consistencyLevel: number,
  ): AsyncGenerator<TonUnsignedTransaction<N, C>> {
    throw new Error("Method not implemented.");
  }

  async *verifyMessage(_sender: AnyTonAddress, vaa: VAA): AsyncGenerator<TonUnsignedTransaction<N, C>> {
    const vaaBytes = serialize(vaa);
    const vaaCell = beginCell().storeBuffer(Buffer.from(vaaBytes)).endCell();
    const body = beginCell().storeRef(vaaCell).endCell();

    const tx = new TonUnsignedTransaction<N, C>(
      {
        to: this.coreBridge,
        value: await this.getMessageFee(),
        body,
        bounce: false,
      },
      this.network,
      this.chain,
      "Core.PostVAA",
      false,
    );

    yield tx;
  }

  async parseTransaction(txid: string): Promise<WormholeMessageId[]> {
    const msgs = await this.parseMessages(txid);
    return msgs.map((message: VAA<"Uint8Array">) => {
      return {
        chain: message.emitterChain,
        emitter: message.emitterAddress,
        sequence: message.sequence,
      };
    });
  }

  async parseMessages(txid: string): Promise<VAA<"Uint8Array">[]> {
    const EVENT_PUBLISH_MESSAGE = 0xa237a664;

    // 1) Fetch transaction by txid; supported formats:
    //    a) address:lt:hash (TON standard)
    //    b) external message hash (in-msg hash)
    const parts = txid.split(":");
    let tx: any | undefined;
    const conn: any = this.connection as any;

    try {
      if (parts.length === 3) {
        const [addrStr, lt, hash] = parts as [string, string, string];
        const addr = TonCoreAddress.parse(addrStr as string);
        const res = await conn.getTransactions(addr, { lt: lt as string, hash: hash as string, limit: 1 });
        tx = Array.isArray(res) ? res[0] : res;
      } else {
        let message: any | undefined;
        try {
          message = await conn.getBlockchainMessageByHash(txid);
        } catch {}

        if (!message && /^[0-9a-fA-F]{64}$/.test(txid)) {
          const b64 = Buffer.from(txid, "hex").toString("base64");
          try {
            message = await conn.getBlockchainMessageByHash(b64);
          } catch {}
        }

        if (!message) throw new Error("External message not found by hash");

        const dst = message.dst || message.destination || message.dst_address || message.recipient;
        const createdLt = message.created_lt || message.createdLt || message.lt;
        if (!dst || !createdLt) throw new Error("Message missing dst/created_lt");

        const dstStr: string = typeof dst === "string" ? dst : String(dst);
        const addr = TonCoreAddress.parse(dstStr);
        const res = await conn.getTransactions(addr, { lt: createdLt, limit: 5 });
        const list: any[] = Array.isArray(res) ? res : [res];
        // Find a transaction whose incoming message matches the given hash
        const normHash = (h: string) => (h.startsWith("0x") ? h.slice(2).toLowerCase() : h.toLowerCase());
        const targetHashHex = /^[0-9a-fA-F]{64}$/.test(txid)
          ? txid.toLowerCase()
          : Buffer.from(txid, "base64").toString("hex").toLowerCase();

        tx = list.find((t) => {
          const inMsgHash = t?.in_msg?.hash || t?.inMessage?.hash || t?.in_msg_hash || t?.inMsgHash;
          if (!inMsgHash) return false;
          const h = normHash(String(inMsgHash));
          return h === targetHashHex;
        }) || list[0];
      }
    } catch (e) {
      throw new Error(`Failed to fetch TON transaction: ${String(e)}`);
    }

    if (!tx) return [];

    const outMsgs: any[] = (tx.out_msgs ?? tx.outMessages ?? []);

    const vaas: VAA<"Uint8Array">[] = [];

    for (const m of outMsgs) {
      // Extract message body encoded as BOC
      const bodyBoc: Uint8Array | Buffer | string | undefined = m.body || m.msg_data?.body || m.msg_body;
      if (!bodyBoc) continue;

      let bodyCell: Cell | null = null;
      try {
        if (typeof bodyBoc === "string") {
          const buf = Buffer.from(bodyBoc, "base64");
          bodyCell = Cell.fromBoc(buf)[0] ?? null;
        } else if (bodyBoc && (bodyBoc as any).constructor === Uint8Array) {
          const buf = Buffer.from(bodyBoc as Uint8Array);
          bodyCell = Cell.fromBoc(buf)[0] ?? null;
        } else if (Buffer.isBuffer(bodyBoc as any)) {
          bodyCell = Cell.fromBoc(bodyBoc as Buffer)[0] ?? null;
        } else if ((bodyBoc as any)?._bits) {
          bodyCell = bodyBoc as unknown as Cell;
        }
      } catch {}
      if (!bodyCell) continue;

      const s = bodyCell.beginParse();
      let opcode = 0;
      try {
        opcode = s.loadUint(32);
      } catch {
        continue;
      }

      if (opcode !== EVENT_PUBLISH_MESSAGE) continue;

      // MessagePublishedEvent {
      //   sender: address; sequence: u64; nonce: u32; payload: cell; consistencyLevel: u8
      // }
      let senderAddr: TonCoreAddress;
      let sequence: bigint;
      let nonce: number;
      let payloadCell: Cell;
      let consistencyLevel: number;
      try {
        senderAddr = s.loadAddress();
        sequence = s.loadUintBig(64);
        nonce = s.loadUint(32);
        payloadCell = s.loadRef();
        consistencyLevel = s.loadUint(8);
      } catch {
        continue;
      }

      const emitter = new UniversalAddress(normalizeTonTo32Bytes(senderAddr.toString()));

      const payloadBytes = new Uint8Array(payloadCell.toBoc());

      const ts = Number(tx.utime ?? tx.now ?? Math.floor(Date.now() / 1000));

      const vaa = createVAA("Uint8Array", {
        guardianSet: 0,
        emitterChain: this.chain,
        emitterAddress: emitter,
        sequence: BigInt(sequence),
        timestamp: ts,
        consistencyLevel: Number(consistencyLevel),
        nonce: Number(nonce),
        signatures: [],
        payload: payloadBytes,
      });

      vaas.push(vaa);
    }

    return vaas;
  }
}