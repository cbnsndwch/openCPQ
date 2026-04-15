import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { string } from '../components/primitives';
import { select, option, defaultOption } from '../components/select';
import type { SelectNode } from '../components/select';
import { rootPath } from '../core/path';
import { Problems } from '../core/problems';
import type { Ctx } from '../core/types';

function baseCtx(value: unknown, updateTo: (v: unknown) => void): Ctx {
    return {
        path: rootPath,
        problems: new Problems(),
        value,
        updateTo
    } as Ctx;
}

describe('select', () => {
    const type = select([
        defaultOption(option('a', 'Option A')),
        option('b', 'Option B', string()),
        option('c', 'Option C')
    ]);

    it('picks the default option when no value is set', () => {
        const updateTo = vi.fn();
        const node = type.makeNode(
            baseCtx(undefined, updateTo)
        ) as unknown as SelectNode;
        expect(node.optionName).toBe('a');
    });

    it('honors an explicit user selection', () => {
        const updateTo = vi.fn();
        const node = type.makeNode(
            baseCtx({ $option: 'b', $detail: 'hello' }, updateTo)
        ) as unknown as SelectNode;
        expect(node.optionName).toBe('b');
    });

    it('renders all visible options', () => {
        const updateTo = vi.fn();
        const node = type.makeNode(baseCtx(undefined, updateTo));
        render(<>{node.render()}</>);
        expect(screen.getByText('Option A')).toBeDefined();
        expect(screen.getByText('Option B')).toBeDefined();
        expect(screen.getByText('Option C')).toBeDefined();
    });
});
