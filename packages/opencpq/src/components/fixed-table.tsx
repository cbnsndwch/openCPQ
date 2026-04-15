import type { FC, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { group, member, findMember, type GroupNode } from './group';
import type { RawMemberDecls } from './group';
import type { LabeledNode } from './label';
import type { Column } from './table';

function asLabeled(n: INode): LabeledNode | undefined {
    return (n as unknown as { kind?: string }).kind === 'labeled'
        ? (n as unknown as LabeledNode)
        : undefined;
}

export type RawColumnsSpec =
    | Column
    | undefined
    | RawColumnsSpec[]
    | ((ctx: Ctx) => RawColumnsSpec);

function preprocessColumns(rawColumnsSpec: RawColumnsSpec, ctx: Ctx): Column[] {
    const columns: Column[] = [];
    function process(c: RawColumnsSpec): void {
        if (c === undefined) return;
        if (Array.isArray(c)) c.forEach(process);
        else if (typeof c === 'function') process(c(ctx));
        else columns.push(c);
    }
    process(rawColumnsSpec);
    return columns;
}

export interface FixedTableNode {
    readonly kind: 'fixedTable';
    readonly columns: Column[];
    readonly rows: GroupNode;
}

export function fixedTable(
    columnsSpec: RawColumnsSpec,
    rows: RawMemberDecls
): Type {
    return new Type('fixedTable', function makeFixedTable(ctx) {
        return makeDataNode<FixedTableNode>({
            kind: 'fixedTable',
            columns: preprocessColumns(columnsSpec, ctx),
            rows: group(rows).makeNode(ctx) as unknown as GroupNode
        });
    });
}

const FixedTableView: FC<{ node: FixedTableNode }> = ({ node }) => {
    const { columns, rows } = node;
    return (
        <table className="cpq-fixed-table">
            <colgroup>
                <col className="cpq-col-heading" />
                {columns.map(({ name }) => (
                    <col key={name} className={`cpq-col-${name}`} />
                ))}
            </colgroup>
            <tbody>
                <tr>
                    <th />
                    {columns.map(({ name, label }) => (
                        <th key={name}>{label}</th>
                    ))}
                </tr>
                {rows.members.map(({ node: rowNode }) => {
                    let label: ReactNode = null;
                    let inner: GroupNode;
                    const labeledRow = asLabeled(rowNode);
                    if (labeledRow) {
                        label = labeledRow.label;
                        inner = labeledRow.inner as unknown as GroupNode;
                    } else {
                        inner = rowNode as unknown as GroupNode;
                    }
                    return (
                        <tr key={String(label)}>
                            <td>{label}</td>
                            {columns.map(({ name }) => {
                                const cell = findMember(inner, name);
                                return (
                                    <td key={name}>
                                        {cell === undefined
                                            ? null
                                            : cell.render()}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
registerView('fixedTable', FixedTableView);

export function row(
    name: string,
    label: ReactNode,
    cells: RawMemberDecls
): { name: string; type: Type } {
    return member(name, label, group(cells));
}
