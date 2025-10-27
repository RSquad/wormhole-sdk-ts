/// <reference path="../../platforms/ton/src/index.ts" />
import type { PlatformDefinition } from "./index.js";
const ton = async (): Promise<PlatformDefinition<"Ton">> =>
    (await import("./platforms/ton.js")).default;
export default ton;
