import type { FC, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { INode } from '../core/types';

export interface LabeledNode {
    readonly kind: 'labeled';
    readonly label: ReactNode;
    readonly inner: INode;
    readonly value: unknown;
}

export function labeled(label: ReactNode, type: Type): Type {
    return new Type('labeled', function makeLabeled(ctx) {
        const innerNode = type.makeNode(ctx);
        return makeDataNode<LabeledNode>({
            kind: 'labeled',
            label,
            inner: innerNode,
            value: innerNode.value
        });
    });
}

const LabeledView: FC<{ node: LabeledNode }> = ({ node }) => (
    <div className="cpq-labeled">
        <div className="cpq-labeled-label">{node.label}</div>
        <div className="cpq-labeled-data">{node.inner.render()}</div>
    </div>
);
registerView('labeled', LabeledView);
