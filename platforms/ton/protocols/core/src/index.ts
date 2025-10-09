import { registerProtocol } from "@wormhole-foundation/sdk-connect";
import { TonWormholeCore } from "./core.js";

registerProtocol("Ton", "WormholeCore", TonWormholeCore);

export * from "./core.js";
