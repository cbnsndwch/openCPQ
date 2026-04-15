import type { ReactNode } from 'react';

import type { Path } from './path';
import type { Problems } from './problems';

export interface CtxBase {
    path: Path;
    problems: Problems;
    value?: unknown;
    updateTo: (newValue: unknown) => void;
    [key: string]: unknown;
}

export type Ctx<T = unknown> = CtxBase & { value?: T };

export interface INode {
    render(): ReactNode;
    readonly value?: unknown;
    visit<R>(v: Visitor<R>): R;
}

export type Visitor<R = unknown> = {
    unimplemented: (node: INode) => R;
} & Record<string, (node: INode) => R>;
