import type { FC, ReactNode } from 'react';

import { Type } from '../core/base';
import { makeDataNode, registerView } from '../core/node-view';
import type { Ctx, INode } from '../core/types';

import { findMember, type GroupNode } from './group';

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

export interface TableNode {
    readonly kind: 'table';
    readonly columns: Column[];
    readonly rows: INode[];
    readonly list: unknown[];
    readonly splice: (...args: [number, number, ...unknown[]]) => void;
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
        const rows: INode[] = value.map((element = {}, i) => {
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
        return makeDataNode<TableNode>({
            kind: 'table',
            columns: columnLabels,
            rows,
            list: value,
            splice
        });
    });
}

const TableView: FC<{ node: TableNode }> = ({ node }) => {
    const { columns, rows, list, splice } = node;
    return (
        <table className="cpq-table">
            <colgroup>
                <col className="cpq-col-buttons" />
                {columns.map(({ name }) => (
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
                    {columns.map(({ name, label }) => (
                        <th key={name}>{label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length + 1}>
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
                            {columns.map(({ name }) => {
                                const cell = findMember(
                                    row as unknown as GroupNode,
                                    name
                                );
                                return (
                                    <td key={name}>
                                        {cell === undefined
                                            ? null
                                            : cell.render()}
                                    </td>
                                );
                            })}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};
registerView('table', TableView);

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
