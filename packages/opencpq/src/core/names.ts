import { Type } from "./base";
import type { Node } from "./base";
import { CSideEffect } from "./util";

export function CNameSpace(nameSpaceName: string, type: Type): Type {
    return new Type("nameSpace", function makeNameSpace(ctx) {
        return type.makeNode({ ...ctx, [nameSpaceName]: {} });
    });
}

const identity = <T,>(x: T): T => x;

export interface CNamedOptions {
    valueAccessor?: (node: Node) => unknown;
}

export function CNamed(
    nameSpaceName: string,
    name: string,
    options: CNamedOptions,
    type: Type
): Type {
    const { valueAccessor = identity } = options;
    return CSideEffect((node, ctx) => {
        const ns = ctx[nameSpaceName] as Record<string, unknown>;
        ns[name] = valueAccessor(node);
    }, type);
}
