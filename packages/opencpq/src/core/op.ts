import { Type } from './base';
import type { Node } from './base';
import type { Ctx } from './types';

export type OpFn = (ctx: Ctx, make: (ctx: Ctx, type: Type) => Node) => Node;

export function op(fn: OpFn): Type {
    return new Type('op', function makeOp(ctx) {
        return fn(ctx, (c, t) => t.makeNode(c));
    });
}
