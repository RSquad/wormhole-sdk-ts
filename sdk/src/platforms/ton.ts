import * as _ton from "@wormhole-foundation/sdk-ton";
import type { PlatformDefinition } from "../index.js";
import { applyChainsConfigConfigOverrides } from "@wormhole-foundation/sdk-connect";

/** Platform and protocol definitions for Ton */
const ton: PlatformDefinition<typeof _ton._platform> = {
    Address: _ton.TonAddress,
    Platform: _ton.TonPlatform,
    getSigner: _ton.getTonSigner,
    protocols: {
        WormholeCore: () => import("@wormhole-foundation/sdk-ton-core"),
    },
    getChain: (network, chain, overrides?) =>
        new _ton.TonChain(
            chain,
            new _ton.TonPlatform(
                network,
                applyChainsConfigConfigOverrides(network, _ton._platform, {
                    [chain]: overrides,
                }),
            ),
        ),
};

export default ton;