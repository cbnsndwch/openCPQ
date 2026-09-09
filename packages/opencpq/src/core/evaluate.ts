import type { Type, Node } from './base';
import type { Aggregator } from './linear-aggregation';
import { rootPath } from './path';
import { Problems } from './problems';
import type { Ctx } from './types';

export interface Evaluated<A extends Record<string, Aggregator>> {
    node: Node;
    ctx: Ctx;
    problems: Problems;
    aggregators: A;
}

/**
 * Evaluate `type` against `value` with no UI. `aggregators` are placed on the
 * root ctx and registered in `linearAggregators`, so `t.multiplying` and
 * `t.quantified` scale them and totals can be read afterwards.
 */
export function evaluate<A extends Record<string, Aggregator>>(
    type: Type,
    value: unknown,
    aggregators: A,
    extraCtx: Record<string, unknown> = {}
): Evaluated<A> {
    const problems = new Problems();
    const ctx = {
        path: rootPath,
        problems,
        value,
        updateTo: () => undefined,
        ...extraCtx,
        ...aggregators,
        linearAggregators: Object.keys(aggregators)
    } as Ctx;
    const node = type.makeNode(ctx);
    return { node, ctx, problems, aggregators };
}
