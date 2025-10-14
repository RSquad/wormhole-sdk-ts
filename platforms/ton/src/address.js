import { UniversalAddress, registerNative, encoding } from "@wormhole-foundation/sdk-connect";
import { Address as TonCoreAddress } from "@ton/core";
import { _platform } from "./types.js";
function ensure32ByteHex(address) {
    let a = address.toLowerCase();
    if (a.startsWith("0x"))
        a = a.slice(2);
    if (!encoding.hex.valid(a))
        throw new Error(`Invalid hex address: ${address}`);
    if (a.length > 64)
        throw new Error(`Hex is longer than 32 bytes: ${address}`);
    a = a.padStart(64, "0");
    return encoding.hex.decode(a);
}
function tryParseRawWcHex(s) {
    const idx = s.indexOf(":");
    if (idx <= 0)
        return null;
    const wcStr = s.slice(0, idx);
    const hex = s.slice(idx + 1);
    if (!(wcStr === "0" || wcStr === "-1"))
        return null;
    if (!/^[0-9a-fA-F]{64}$/.test(hex))
        return null;
    return encoding.hex.decode(hex);
}
export function normalizeTonTo32Bytes(addr) {
    if (addr instanceof TonAddress)
        return addr.toUint8Array();
    if (addr instanceof UniversalAddress)
        return addr.toUint8Array();
    if (addr instanceof Uint8Array) {
        if (addr.length !== 32)
            throw new Error(`TON address bytes must be 32 long, got ${addr.length}`);
        return new Uint8Array(addr);
    }
    const s = addr.trim();
    // try user-friendly
    try {
        const parsed = TonCoreAddress.parse(s);
        // В @ton/core у parsed есть .hash (Buffer) и .workChain
        const hash = parsed.hash; // Buffer
        if (!hash || hash.length !== 32) {
            throw new Error(`Parsed TON address has invalid hash length: ${hash?.length ?? "unknown"}`);
        }
        return new Uint8Array(hash);
    }
    catch (_) {
    }
    // try raw
    const raw = tryParseRawWcHex(s);
    if (raw)
        return raw;
    //try hex
    return ensure32ByteHex(s);
}
export class TonAddress {
    static byteSize = 32;
    static platform = _platform;
    type = "Native";
    address;
    constructor(address) {
        this.address = normalizeTonTo32Bytes(address);
    }
    unwrap() {
        return "0x" + encoding.hex.encode(this.address);
    }
    toString() {
        return this.unwrap();
    }
    toNative() {
        return this;
    }
    toUint8Array() {
        return this.address;
    }
    toUniversalAddress() {
        return new UniversalAddress(this.toUint8Array());
    }
    static instanceof(address) {
        return address?.constructor?.platform === TonAddress.platform;
    }
    equals(other) {
        if (TonAddress.instanceof(other)) {
            return encoding.hex.encode(other.address) === encoding.hex.encode(this.address);
        }
        else {
            return this.toUniversalAddress().equals(other);
        }
    }
}
registerNative(_platform, TonAddress);
//# sourceMappingURL=address.js.map