import type { ReactNode } from "react";
import { Type } from "../core/base";
import type { Ctx } from "../core/types";
import { GroupNode, preprocessMembers } from "./group";
import type { Member, RawMemberDecls } from "./group";
import { LabeledNode } from "./label";

export function CTabbedArea(rawMemberDecls: RawMemberDecls): Type {
    return new Type("tabbed-area", function makeTabbedArea(ctx) {
        const { value = {}, updateTo } = ctx as Ctx & {
            value?: { selectedView?: number };
        };
        return new TabbedAreaNode(
            value?.selectedView ?? 0,
            (key: number) => updateTo({ ...value, selectedView: key }),
            preprocessMembers(rawMemberDecls, ctx)
        );
    });
}

export class TabbedAreaNode extends GroupNode {
    private readonly _selected: number;
    private readonly _select: (key: number) => void;

    constructor(selected: number, select: (key: number) => void, members: Member[]) {
        super(members);
        this._selected = selected;
        this._select = select;
    }

    override render(): ReactNode {
        const members = this.members;
        const activeIndex = Math.max(
            0,
            Math.min(this._selected, members.length - 1)
        );
        return (
            <div className="cpq-tabbed-area" role="tablist">
                <div className="cpq-tabs">
                    {members.map(({ node }, i) => {
                        let label: ReactNode = "???";
                        if (node instanceof LabeledNode) label = node.label;
                        const selected = i === activeIndex;
                        return (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                className={`cpq-tab ${selected ? "cpq-tab-active" : ""}`}
                                onClick={() => this._select(i)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div className="cpq-tab-panels">
                    {members.map(({ node }, i) => {
                        if (i !== activeIndex) return null;
                        const body =
                            node instanceof LabeledNode ? node.inner : node;
                        return (
                            <div key={i} role="tabpanel" className="cpq-tab-panel">
                                {body.render()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
