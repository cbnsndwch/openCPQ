import { Type } from "./base";
import type { Ctx } from "./types";
import type { Node } from "./base";
import { CUnit } from "../components/primitives";

export function CSideEffect(
    fn: (node: Node, ctx: Ctx) => void,
    type: Type = CUnit()
): Type {
    return new Type("sideEffect", function makeSideEffect(ctx) {
        const node = type.makeNode(ctx);
        fn(node, ctx);
        return node;
    });
}
