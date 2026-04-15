import type { FC, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { preprocessMembers, type Member, type RawMemberDecls } from './group';
import type { LabeledNode } from './label';

function asLabeled(n: INode): LabeledNode | undefined {
    return (n as unknown as { kind?: string }).kind === 'labeled'
        ? (n as unknown as LabeledNode)
        : undefined;
}

export interface AccordionNode {
    readonly kind: 'accordion';
    readonly members: readonly Member[];
    readonly selected: number;
    readonly select: (key: number) => void;
}

export function accordion(rawMemberDecls: RawMemberDecls): Type {
    return new Type('accordion', function makeAccordion(ctx) {
        const { value = {}, updateTo } = ctx as Ctx & {
            value?: { selectedView?: number };
        };
        return makeDataNode<AccordionNode>({
            kind: 'accordion',
            members: preprocessMembers(rawMemberDecls, ctx),
            selected: value?.selectedView ?? 0,
            select: (key: number) => updateTo({ ...value, selectedView: key })
        });
    });
}

const AccordionView: FC<{ node: AccordionNode }> = ({ node }) => {
    const { members, selected, select } = node;
    return (
        <div className="cpq-accordion">
            {members.map(({ node: child }, i) => {
                let label: ReactNode = '???';
                let body: INode = child;
                const labeledNode = asLabeled(child);
                if (labeledNode) {
                    label = labeledNode.label;
                    body = labeledNode.inner;
                }
                const open = i === selected;
                return (
                    <details
                        key={i}
                        open={open}
                        className="cpq-accordion-item"
                        onToggle={e => {
                            if ((e.target as HTMLDetailsElement).open) {
                                select(i);
                            }
                        }}
                    >
                        <summary>{label}</summary>
                        {open && (
                            <div className="cpq-accordion-body">
                                {body.render()}
                            </div>
                        )}
                    </details>
                );
            })}
        </div>
    );
};
registerView('accordion', AccordionView);
