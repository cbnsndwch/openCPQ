import type { ReactNode } from "react";
import { Type, Node } from "../core/base";
import type { Ctx } from "../core/types";
import { CGroup, cmember, GroupNode } from "./group";
import type { RawMemberDecls, Member } from "./group";
import { LabeledNode } from "./label";
import type { Column } from "./table";

export type RawColumnsSpec =
    | Column
    | undefined
    | RawColumnsSpec[]
    | ((ctx: Ctx) => RawColumnsSpec);

function preprocessColumns(
    rawColumnsSpec: RawColumnsSpec,
    ctx: Ctx
): Column[] {
    const columns: Column[] = [];
    function process(c: RawColumnsSpec): void {
        if (c === undefined) return;
        if (Array.isArray(c)) c.forEach(process);
        else if (typeof c === "function") process(c(ctx));
        else columns.push(c);
    }
    process(rawColumnsSpec);
    return columns;
}

export function CFixedTable(
    columnsSpec: RawColumnsSpec,
    rows: RawMemberDecls
): Type {
    return new Type("fixedTable", function makeFixedTable(ctx) {
        return new FixedTableNode({
            columns: preprocessColumns(columnsSpec, ctx),
            rows: CGroup(rows).makeNode(ctx) as GroupNode
        });
    });
}

interface FixedTableNodeOptions {
    columns: Column[];
    rows: GroupNode;
}

export class FixedTableNode extends Node {
    constructor(opts: FixedTableNodeOptions) {
        super(opts as unknown as Record<string, unknown>);
    }

    private get opts(): FixedTableNodeOptions {
        return this.__options as unknown as FixedTableNodeOptions;
    }

    get columns(): Column[] {
        return this.opts.columns;
    }

    get rows(): GroupNode {
        return this.opts.rows;
    }

    override render(): ReactNode {
        const { columns, rows } = this.opts;
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
                    {rows.mapMembers(({ node: row }: Member) => {
                        let label: ReactNode = null;
                        let inner: GroupNode;
                        if (row instanceof LabeledNode) {
                            label = row.label;
                            inner = row.inner as GroupNode;
                        } else {
                            inner = row as GroupNode;
                        }
                        return (
                            <tr key={String(label)}>
                                <td>{label}</td>
                                {columns.map(({ name }) => {
                                    const member = inner.member?.(name);
                                    return (
                                        <td key={name}>
                                            {member === undefined ? null : member.render()}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }
}

export function crow(
    name: string,
    label: ReactNode,
    cells: RawMemberDecls
): { name: string; type: Type } {
    return cmember(name, label, CGroup(cells));
}
