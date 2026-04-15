import type { ReactNode } from 'react';

import { Type, Node } from '../core/base';
import type { Ctx } from '../core/types';

import type { GroupNode } from './group';

export interface Column {
    name: string;
    label: ReactNode;
}

export function column(name: string, label: ReactNode): Column {
    return { name, label };
}

export interface TableOptions {
    defaultValue?: unknown[];
}

export function table(
    options: TableOptions,
    columnLabels: Column[],
    rowType: Type
): Type {
    const { defaultValue = [] } = options;
    return new Type('table', function makeTable(ctx) {
        const { updateTo } = ctx;
        const value = (
            (ctx.value as unknown[] | undefined) ?? defaultValue
        ).slice();
        const rows: Node[] = value.map((element = {}, i) => {
            const updateElement = (newElement: unknown): void => {
                const newList = value.slice();
                newList[i] = newElement;
                updateTo(newList);
            };
            return rowType.makeNode({
                ...ctx,
                value: element,
                updateTo: updateElement,
                rowIndex: i,
                path: ctx.path.ext(i)
            } as Ctx);
        });
        const splice = (...args: [number, number, ...unknown[]]): void => {
            const newList = value.slice();
            newList.splice(...args);
            updateTo(newList);
        };
        return new TableNode({ columnLabels, rows, list: value, splice });
    });
}

interface TableNodeOptions {
    columnLabels: Column[];
    rows: Node[];
    list: unknown[];
    splice: (...args: [number, number, ...unknown[]]) => void;
}

export class TableNode extends Node {
    constructor(options: TableNodeOptions) {
        super(options as unknown as Record<string, unknown>);
    }

    private get opts(): TableNodeOptions {
        return this.__options as unknown as TableNodeOptions;
    }

    get columns(): Column[] {
        return this.opts.columnLabels;
    }

    get rows(): Node[] {
        return this.opts.rows;
    }

    override render(): ReactNode {
        const { columnLabels, rows, list, splice } = this.opts;
        return (
            <table className="cpq-table">
                <colgroup>
                    <col className="cpq-col-buttons" />
                    {columnLabels.map(({ name }) => (
                        <col key={name} className={`cpq-col-${name}`} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th>
                            <button
                                type="button"
                                className="cpq-btn cpq-btn-dim"
                                onClick={() => splice(0, 0, undefined)}
                                aria-label="Prepend row"
                            >
                                +
                            </button>
                        </th>
                        {columnLabels.map(({ name, label }) => (
                            <th key={name}>{label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columnLabels.length + 1}>
                                <div className="cpq-validate cpq-validate-info">
                                    (no entries)
                                </div>
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, i) => (
                            <tr key={i}>
                                <td>
                                    <RowOps
                                        i={i}
                                        len={list.length}
                                        list={list}
                                        splice={splice}
                                    />
                                </td>
                                {columnLabels.map(({ name }) => {
                                    const member = (
                                        row as unknown as GroupNode
                                    ).member?.(name);
                                    return (
                                        <td key={name}>
                                            {member === undefined
                                                ? null
                                                : member.render()}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        );
    }
}

function RowOps({
    i,
    len,
    list,
    splice
}: {
    i: number;
    len: number;
    list: unknown[];
    splice: (...args: [number, number, ...unknown[]]) => void;
}): ReactNode {
    return (
        <details className="cpq-row-ops">
            <summary className="cpq-btn cpq-btn-dim">⋯</summary>
            <menu>
                <li>
                    <button
                        type="button"
                        onClick={() => splice(i + 1, 0, undefined)}
                    >
                        insert
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={() => splice(i + 1, 0, list[i])}
                    >
                        copy
                    </button>
                </li>
                <li>
                    <button type="button" onClick={() => splice(i, 1)}>
                        delete
                    </button>
                </li>
                {i > 0 && (
                    <li>
                        <button
                            type="button"
                            onClick={() =>
                                splice(i - 1, 2, list[i], list[i - 1])
                            }
                        >
                            up
                        </button>
                    </li>
                )}
                {i < len - 1 && (
                    <li>
                        <button
                            type="button"
                            onClick={() => splice(i, 2, list[i + 1], list[i])}
                        >
                            down
                        </button>
                    </li>
                )}
            </menu>
        </details>
    );
}
