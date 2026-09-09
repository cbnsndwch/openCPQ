import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { View } from './workbench';

export class TOC {
    private readonly _children: {
        fragment: string;
        heading: ReactNode;
        child: TOC;
    }[] = [];

    add(fragment: string, heading: ReactNode, child: TOC): void {
        this._children.push({ fragment, heading, child });
    }

    get children(): readonly {
        fragment: string;
        heading: ReactNode;
        child: TOC;
    }[] {
        return this._children;
    }

    render(): ReactNode {
        if (this._children.length === 0) return null;
        return (
            <ul className="cpq-toc">
                {this._children.map(({ fragment, heading, child }) => (
                    <li key={fragment}>
                        <a href={`#${fragment}`}>{heading}</a>
                        {child.render()}
                    </li>
                ))}
            </ul>
        );
    }
}

export function VTOC(ctx: { toc: TOC }): View {
    return new View('toc', () => ctx.toc.render());
}

export type HeadingFn = (node: INode, ctx: Ctx) => ReactNode;

export interface TOCNode {
    readonly kind: 'tocEntry';
    readonly fragment: string;
    readonly inner: INode;
}

export function tocEntry(name: string, headingFn: HeadingFn, type: Type): Type {
    return new Type('tocEntry', function makeTOCEntry(ctx) {
        const fragment = ctx.path.ext(name).toString();
        const subTOC = new TOC();
        const innerNode = type.makeNode({ ...ctx, toc: subTOC });
        (ctx.toc as TOC).add(fragment, headingFn(innerNode, ctx), subTOC);
        return makeDataNode<TOCNode>({
            kind: 'tocEntry',
            fragment,
            inner: innerNode
        });
    });
}

const TOCView: ComponentType<{ node: TOCNode }> = ({ node }) => (
    <span id={node.fragment}>{node.inner.render()}</span>
);
registerView('tocEntry', TOCView);
