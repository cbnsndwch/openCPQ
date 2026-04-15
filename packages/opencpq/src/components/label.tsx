import type { ReactNode } from "react";
import { Type, Node } from "../core/base";

export function CLabeled(label: ReactNode, type: Type): Type {
    return new Type("labeled", function makeLabeled(ctx) {
        return new LabeledNode(label, type.makeNode(ctx));
    });
}

export class LabeledNode extends Node {
    private readonly _label: ReactNode;
    private readonly _innerNode: Node;

    constructor(label: ReactNode, innerNode: Node) {
        super();
        this._label = label;
        this._innerNode = innerNode;
    }

    get label(): ReactNode {
        return this._label;
    }

    get inner(): Node {
        return this._innerNode;
    }

    override get value(): unknown {
        return this._innerNode.value;
    }

    override render(): ReactNode {
        return (
            <div className="cpq-labeled">
                <div className="cpq-labeled-label">{this._label}</div>
                <div className="cpq-labeled-data">{this._innerNode.render()}</div>
            </div>
        );
    }
}
