import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";

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

export function CWorkbench(
    viewsFn: ViewsFn,
    render: WorkbenchRender,
    type: Type
): Type {
    return new Type("workbench", function makeWorkbench(ctx) {
        return new WorkbenchNode({
            views: viewsFn(ctx),
            render,
            node: type.makeNode(ctx)
        });
    });
}

interface WorkbenchNodeOptions {
    views: View[];
    render: WorkbenchRender;
    node: Node;
}

export class WorkbenchNode extends Node {
    constructor(options: WorkbenchNodeOptions) {
        super(options as unknown as Record<string, unknown>);
    }
    private get opts(): WorkbenchNodeOptions {
        return this.__options as unknown as WorkbenchNodeOptions;
    }
    get inner(): Node {
        return this.opts.node;
    }
    override render(): ReactNode {
        const { views, render, node } = this.opts;
        return render(node, views);
    }
}
