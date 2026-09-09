// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { evaluate, NamedAdder, SimpleAdder, t } from '../index';

describe('evaluate', () => {
    it('supports headless rollups, validation, and SSR rendering', () => {
        const totals = new SimpleAdder();
        const namedTotals = new NamedAdder();
        const type = t.group([
            t.member(
                'line',
                'Line',
                t.quantified(
                    t.sideEffect(
                        (_node, ctx) => {
                            (ctx.totals as SimpleAdder).add(10);
                            (ctx.namedTotals as NamedAdder).add('line', 2);
                        },
                        t.validate((node, { error }) => {
                            if (node.value !== 'ok') error('Value must be ok.');
                        }, t.string({ defaultValue: 'ok' }))
                    )
                )
            )
        ]);

        const { node, ctx, problems, aggregators } = evaluate(
            type,
            { line: { quantity: 3, value: 'bad' } },
            { totals, namedTotals }
        );

        expect(aggregators.totals.get()).toBe(30);
        expect(aggregators.namedTotals.get('line')).toBe(6);
        expect(ctx.linearAggregators).toEqual(['totals', 'namedTotals']);
        expect(problems.empty()).toBe(false);
        expect(problems.mapProblems(p => p.msg)).toContain('Value must be ok.');

        const html = renderToStaticMarkup(node.render());
        expect(html).toContain('Line');
        expect(html).toContain('Value must be ok.');
    });
});
