import { Type } from './base';
import type { Node } from './base';
import { sideEffect } from './util';

export function namespace(nameSpaceName: string, type: Type): Type {
    return new Type('nameSpace', function makeNameSpace(ctx) {
        return type.makeNode({ ...ctx, [nameSpaceName]: {} });
    });
}

const identity = <T>(x: T): T => x;

export interface NamedOptions {
    valueAccessor?: (node: Node) => unknown;
}

export function named(
    nameSpaceName: string,
    name: string,
    options: NamedOptions,
    type: Type
): Type {
    const { valueAccessor = identity } = options;
    return sideEffect((node, ctx) => {
        const ns = ctx[nameSpaceName] as Record<string, unknown>;
        ns[name] = valueAccessor(node);
    }, type);
}
