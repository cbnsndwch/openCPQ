import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx } from '../core/types';

export interface HtmlNode {
    readonly kind: 'html';
    readonly html: ReactNode;
}

export function html(x: ReactNode | ((ctx: Ctx) => ReactNode)): Type {
    return new Type('html', function makeHtmlNode(ctx) {
        return makeDataNode<HtmlNode>({
            kind: 'html',
            html: typeof x === 'function' ? x(ctx) : x
        });
    });
}

const HtmlView: ComponentType<{ node: HtmlNode }> = ({ node }) => (
    <>{node.html}</>
);
registerView('html', HtmlView);
