import type { ComponentType, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { labeled } from './label';

export interface MemberDecl {
    name: string;
    type: Type;
}

export interface Member {
    name: string;
    node: INode;
}

export type RawMemberDecls =
    | MemberDecl
    | undefined
    | RawMemberDecls[]
    | ((ctx: Ctx) => RawMemberDecls);

export function member(name: string, label: ReactNode, type: Type): MemberDecl {
    return { name, type: labeled(label, type) };
}

export function unlabelledMember(name: string, type: Type): MemberDecl {
    return { name, type };
}

function makeMemberNode({ name, type }: MemberDecl, ctx: Ctx): Member {
    const {
        path,
        value = {},
        updateTo
    } = ctx as Ctx & {
        value?: Record<string, unknown>;
    };
    return {
        name,
        node: type.makeNode({
            ...ctx,
            path: path.ext(name),
            value: (value as Record<string, unknown>)[name],
            updateTo: (newValue: unknown) =>
                updateTo({
                    ...(value as Record<string, unknown>),
                    [name]: newValue
                })
        })
    };
}

export function preprocessMembers(
    rawMemberDecls: RawMemberDecls,
    ctx: Ctx
): Member[] {
    const members: Member[] = [];
    function process(m: RawMemberDecls): void {
        if (m === undefined) return;
        if (Array.isArray(m)) {
            m.forEach(process);
        } else if (typeof m === 'function') {
            process(m(ctx));
        } else {
            members.push(makeMemberNode(m, ctx));
        }
    }
    process(rawMemberDecls);
    return members;
}

export interface GroupNode {
    readonly kind: 'group';
    readonly members: readonly Member[];
}

export function findMember(node: GroupNode, name: string): INode | undefined {
    return node.members.find(m => m.name === name)?.node;
}

export function group(rawMemberDecls: RawMemberDecls): Type {
    return new Type('group', function makeGroup(ctx) {
        return makeDataNode<GroupNode>({
            kind: 'group',
            members: preprocessMembers(rawMemberDecls, ctx)
        });
    });
}

const GroupView: ComponentType<{ node: GroupNode }> = ({ node }) => (
    <div className="cpq-group">
        {node.members.map(({ node: child }, i) => (
            <div key={i} className="cpq-group-member">
                {child.render()}
            </div>
        ))}
    </div>
);
registerView('group', GroupView);
