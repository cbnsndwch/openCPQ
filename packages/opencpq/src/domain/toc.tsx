import type { ReactNode } from 'react';

import { Type, Node } from '../core/base';
import type { Ctx } from '../core/types';

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

export type HeadingFn = (node: Node, ctx: Ctx) => ReactNode;

export function tocEntry(
    name: string,
    headingFn: HeadingFn,
    type: Type
): Type {
    return new Type('tocEntry', function makeTOCEntry(ctx) {
        const fragment = ctx.path.ext(name).toString();
        const subTOC = new TOC();
        const node = type.makeNode({ ...ctx, toc: subTOC });
        (ctx.toc as TOC).add(fragment, headingFn(node, ctx), subTOC);
        return new TOCNode({ fragment, node });
    });
}

interface TOCNodeOptions {
    fragment: string;
    node: Node;
}

export class TOCNode extends Node {
    constructor(opts: TOCNodeOptions) {
        super(opts as unknown as Record<string, unknown>);
    }
    private get opts(): TOCNodeOptions {
        return this.__options as unknown as TOCNodeOptions;
    }
    get inner(): Node {
        return this.opts.node;
    }
    override render(): ReactNode {
        const { fragment, node } = this.opts;
        return <span id={fragment}>{node.render()}</span>;
    }
}
