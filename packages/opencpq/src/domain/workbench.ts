import type { ComponentType, ReactNode } from 'react';
import { createElement, Fragment } from 'react';

import { Type, Node } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx } from '../core/types';

export class View {
    readonly name: string;
    readonly render: () => ReactNode;
    constructor(name: string, render: () => ReactNode) {
        this.name = name;
        this.render = render;
    }
}

export type ViewsFn = (ctx: Ctx) => View[];
export type WorkbenchRender = (node: Node, views: View[]) => ReactNode;

export interface WorkbenchNode {
    readonly kind: 'workbench';
    readonly views: View[];
    readonly renderFn: WorkbenchRender;
    readonly inner: Node;
}

export function workbench(
    viewsFn: ViewsFn,
    render: WorkbenchRender,
    type: Type
): Type {
    return new Type('workbench', function makeWorkbench(ctx) {
        return makeDataNode<WorkbenchNode>({
            kind: 'workbench',
            views: viewsFn(ctx),
            renderFn: render,
            inner: type.makeNode(ctx)
        });
    });
}

const WorkbenchView: ComponentType<{ node: WorkbenchNode }> = ({ node }) =>
    createElement(Fragment, null, node.renderFn(node.inner, node.views));
registerView('workbench', WorkbenchView);
