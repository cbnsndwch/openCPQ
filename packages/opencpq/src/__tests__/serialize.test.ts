import { describe, it, expect } from 'vitest';

import { serialize, deserialize } from '../core/serialize';

describe('serialize/deserialize', () => {
    it('round-trips primitives', () => {
        for (const v of [
            undefined,
            null,
            true,
            false,
            0,
            42,
            -3.14,
            '',
            'hi'
        ]) {
            expect(deserialize(serialize(v))).toEqual(v);
        }
    });

    it('round-trips objects and arrays', () => {
        const obj = { a: 1, b: [1, 2, 3], c: { d: 'nested' } };
        expect(deserialize(serialize(obj))).toEqual(obj);
    });

    it('handles sparse arrays', () => {
        // eslint-disable-next-line no-sparse-arrays
        const a = [1, , 3];
        const out = deserialize(serialize(a)) as unknown[];
        expect(out.length).toBe(3);
        expect(out[0]).toBe(1);
        expect(out[2]).toBe(3);
        expect(1 in out).toBe(false);
    });

    it('handles circular references', () => {
        const c: Record<string, unknown> = { foo: [1] };
        c.self = c;
        const s = serialize(c);
        const out = deserialize(s) as Record<string, unknown>;
        expect(out.foo).toEqual([1]);
        expect(out.self).toBe(out);
    });

    it('handles aliased references', () => {
        const shared = { x: 1 };
        const a = { left: shared, right: shared };
        const out = deserialize(serialize(a)) as {
            left: object;
            right: object;
        };
        expect(out.left).toBe(out.right);
    });

    it('preserves Date objects', () => {
        const d = new Date(2026, 3, 14);
        const out = deserialize(serialize(d));
        expect(out).toBeInstanceOf(Date);
        expect((out as Date).getTime()).toBe(d.getTime());
    });
});
