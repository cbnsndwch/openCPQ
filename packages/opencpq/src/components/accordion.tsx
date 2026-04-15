import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";
import { GroupNode, preprocessMembers } from "./group";
import type { Member, RawMemberDecls } from "./group";
import { LabeledNode } from "./label";

export function CAccordion(rawMemberDecls: RawMemberDecls): Type {
    return new Type("accordion", function makeAccordion(ctx) {
        const { value = {}, updateTo } = ctx as Ctx & {
            value?: { selectedView?: number };
        };
        return new AccordionNode(
            value?.selectedView ?? 0,
            (key: number) => updateTo({ ...value, selectedView: key }),
            preprocessMembers(rawMemberDecls, ctx)
        );
    });
}

export class AccordionNode extends GroupNode {
    private readonly _selected: number;
    private readonly _select: (key: number) => void;

    constructor(selected: number, select: (key: number) => void, members: Member[]) {
        super(members);
        this._selected = selected;
        this._select = select;
    }

    override render(): ReactNode {
        return (
            <div className="cpq-accordion">
                {this.mapMembers(({ node }, i) => {
                    let label: ReactNode = "???";
                    let body: Node = node;
                    if (node instanceof LabeledNode) {
                        label = node.label;
                        body = node.inner;
                    }
                    const open = i === this._selected;
                    return (
                        <details
                            key={i}
                            open={open}
                            className="cpq-accordion-item"
                            onToggle={e => {
                                if ((e.target as HTMLDetailsElement).open) {
                                    this._select(i);
                                }
                            }}
                        >
                            <summary>{label}</summary>
                            {open && (
                                <div className="cpq-accordion-body">{body.render()}</div>
                            )}
                        </details>
                    );
                })}
            </div>
        );
    }
}
