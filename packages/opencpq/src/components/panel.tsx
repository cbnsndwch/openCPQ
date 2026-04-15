import type { ReactNode } from "react";
import { Type, Node } from "../core/base";

export interface PanelOptions {
    header?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
}

export function CPanel(options: PanelOptions, type: Type): Type {
    return new Type("panel", function makePanel(ctx) {
        return new PanelNode(options, type.makeNode(ctx));
    });
}

export class PanelNode extends Node {
    private readonly _opts: PanelOptions;
    private readonly _inner: Node;

    constructor(opts: PanelOptions, inner: Node) {
        super();
        this._opts = opts;
        this._inner = inner;
    }

    get inner(): Node {
        return this._inner;
    }

    override render(): ReactNode {
        const { header, collapsible, defaultOpen = true, className } = this._opts;
        const body = this._inner.render();
        if (collapsible) {
            return (
                <details
                    open={defaultOpen}
                    className={`cpq-panel cpq-panel-collapsible ${className ?? ""}`}
                >
                    {header !== undefined && <summary>{header}</summary>}
                    <div className="cpq-panel-body">{body}</div>
                </details>
            );
        }
        return (
            <section className={`cpq-panel ${className ?? ""}`}>
                {header !== undefined && (
                    <header className="cpq-panel-header">{header}</header>
                )}
                <div className="cpq-panel-body">{body}</div>
            </section>
        );
    }
}
