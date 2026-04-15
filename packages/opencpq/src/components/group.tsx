import type { ReactNode } from 'react';

import { Type, Node } from '../core/base';
import type { Ctx } from '../core/types';

import { labeled } from './label';

export interface MemberDecl {
    name: string;
    type: Type;
}

export interface Member {
    name: string;
    node: Node;
}

export type RawMemberDecls =
    | MemberDecl
    | undefined
    | RawMemberDecls[]
    | ((ctx: Ctx) => RawMemberDecls);

export function member(
    name: string,
    label: ReactNode,
    type: Type
): MemberDecl {
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

export function group(rawMemberDecls: RawMemberDecls): Type {
    return new Type('group', function makeGroup(ctx) {
        return new GroupNode(preprocessMembers(rawMemberDecls, ctx));
    });
}

export class GroupNode extends Node {
    private readonly _members: Member[];
    private readonly _indexedMembers: Record<string, Node>;

    constructor(members: Member[]) {
        super();
        this._members = members;
        const idx: Record<string, Node> = {};
        for (const m of members) idx[m.name] = m.node;
        this._indexedMembers = idx;
    }

    mapMembers<R>(fn: (m: Member, i: number) => R): R[] {
        return this._members.map(fn);
    }

    member(name: string): Node | undefined {
        return this._indexedMembers[name];
    }

    get members(): readonly Member[] {
        return this._members;
    }

    override render(): ReactNode {
        return (
            <div className="cpq-group">
                {this.mapMembers(({ node }, i) => (
                    <div key={i} className="cpq-group-member">
                        {node.render()}
                    </div>
                ))}
            </div>
        );
    }
}
