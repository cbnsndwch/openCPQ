import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { preprocessMembers } from './group';
import type { Member, RawMemberDecls } from './group';
import type { LabeledNode } from './label';

function asLabeled(n: INode): LabeledNode | undefined {
    return (n as unknown as { kind?: string }).kind === 'labeled'
        ? (n as unknown as LabeledNode)
        : undefined;
}

export interface TabbedAreaNode {
    readonly kind: 'tabbed-area';
    readonly members: readonly Member[];
    readonly selected: number;
    readonly select: (key: number) => void;
}

export function tabs(rawMemberDecls: RawMemberDecls): Type {
    return new Type('tabbed-area', function makeTabbedArea(ctx) {
        const { value = {}, updateTo } = ctx as Ctx & {
            value?: { selectedView?: number };
        };
        return makeDataNode<TabbedAreaNode>({
            kind: 'tabbed-area',
            members: preprocessMembers(rawMemberDecls, ctx),
            selected: value?.selectedView ?? 0,
            select: (key: number) => updateTo({ ...value, selectedView: key })
        });
    });
}

const TabbedAreaView: ComponentType<{ node: TabbedAreaNode }> = ({ node }) => {
    const { members, selected, select } = node;
    const activeIndex = Math.max(0, Math.min(selected, members.length - 1));
    return (
        <div className="cpq-tabbed-area" role="tablist">
            <div className="cpq-tabs">
                {members.map(({ node: child }, i) => {
                    let label: ReactNode = '???';
                    const labeledNode = asLabeled(child);
                    if (labeledNode) label = labeledNode.label;
                    const isSelected = i === activeIndex;
                    return (
                        <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            className={`cpq-tab ${isSelected ? 'cpq-tab-active' : ''}`}
                            onClick={() => select(i)}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <div className="cpq-tab-panels">
                {members.map(({ node: child }, i) => {
                    if (i !== activeIndex) return null;
                    const labeledBody = asLabeled(child);
                    const body = labeledBody?.inner ?? child;
                    return (
                        <div key={i} role="tabpanel" className="cpq-tab-panel">
                            {body.render()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
registerView('tabbed-area', TabbedAreaView);
