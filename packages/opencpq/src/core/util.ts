import { unit } from '../components/primitives';

import { Type } from './base';
import type { Node } from './base';
import type { Ctx } from './types';

export function sideEffect(
    fn: (node: Node, ctx: Ctx) => void,
    type: Type = unit()
): Type {
    return new Type('sideEffect', function makeSideEffect(ctx) {
        const node = type.makeNode(ctx);
        fn(node, ctx);
        return node;
    });
}
