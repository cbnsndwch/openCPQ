import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";

export function CHtml(x: ReactNode | ((ctx: Ctx) => ReactNode)): Type {
    return new Type("html", function makeHtmlNode(ctx) {
        return new HtmlNode(typeof x === "function" ? x(ctx) : x);
    });
}

export class HtmlNode extends Node {
    private readonly _html: ReactNode;
    constructor(html: ReactNode) {
        super();
        this._html = html;
    }
    override render(): ReactNode {
        return this._html;
    }
    get html(): ReactNode {
        return this._html;
    }
}
