import { createElement, type FC, type ReactNode } from 'react';

import { Node } from './base';
import type { Visitor } from './types';

import type { SelectNode, EitherNode } from '../components/select';

export type DataNode = SelectNode | EitherNode;
export type DataNodeKind = DataNode['kind'];

type ViewFor<K extends DataNodeKind> = FC<{
    node: Extract<DataNode, { kind: K }>;
}>;

type AnyView = FC<{ node: DataNode }>;

const registry: { [K in DataNodeKind]?: AnyView } = {};

export function registerView<K extends DataNodeKind>(
    kind: K,
    view: ViewFor<K>
): void {
    registry[kind] = view as unknown as AnyView;
}

const dataNodeProto = Object.create(Node.prototype) as Node;

Object.defineProperty(dataNodeProto, 'render', {
    value: function render(this: DataNode & Node): ReactNode {
        const View = registry[this.kind] as AnyView | undefined;
        if (!View) {
            throw new Error(`No view registered for node kind "${this.kind}"`);
        }
        return createElement(View, { node: this });
    }
});

Object.defineProperty(dataNodeProto, 'visit', {
    value: function visit<R>(this: DataNode & Node, v: Visitor<R>): R {
        const fn = v[this.kind];
        if (typeof fn === 'function') {
            return fn(this);
        }
        return v.unimplemented(this);
    }
});

export function makeDataNode<N extends DataNode>(data: N): N & Node {
    const descriptors: PropertyDescriptorMap = {
        __options: {
            value: {},
            writable: false,
            enumerable: false,
            configurable: false
        }
    };
    for (const key of Object.keys(data) as (keyof N)[]) {
        descriptors[key as string] = {
            value: data[key],
            writable: false,
            enumerable: true,
            configurable: false
        };
    }
    return Object.create(dataNodeProto, descriptors) as unknown as N & Node;
}
