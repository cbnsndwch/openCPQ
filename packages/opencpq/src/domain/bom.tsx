import type { ReactNode } from 'react';

import { downloadBlob } from '../app/download';
import { Type } from '../core/base';
import { NamedAdder } from '../core/linear-aggregation';
import { sideEffect } from '../core/util';

import { View } from './workbench';

export interface BOMItemEntry {
    itemId: string;
    label?: string;
    materialNumber?: string;
}

function csvLine(fields: (string | number)[]): string {
    return (
        fields
            .map(f =>
                typeof f === 'number' ? f : `"${String(f).replace(/"/g, '""')}"`
            )
            .join(';') + '\n'
    );
}

export class BOMView {
    readonly name: string;
    private readonly __itemMap: Record<string, BOMItemEntry>;
    private readonly __bom: NamedAdder;

    constructor(name: string, itemList: BOMItemEntry[], bom: NamedAdder) {
        this.name = name;
        const itemMap: Record<string, BOMItemEntry> = {};
        for (const e of itemList) itemMap[e.itemId] = e;
        this.__itemMap = itemMap;
        this.__bom = bom;
    }

    render = (): ReactNode => {
        return (
            <div className="cpq-bom">
                <div className="cpq-bom-actions">
                    <button
                        type="button"
                        className="cpq-btn"
                        onClick={() => this.exportCSV()}
                    >
                        Export as CSV
                    </button>
                </div>
                {this.renderBOM()}
            </div>
        );
    };

    exportCSV(): void {
        const csv: string[] = [];
        this.__bom.mapItems((item, quantity) => {
            const entry = this.__itemMap[item];
            csv.push(
                csvLine([
                    quantity,
                    item,
                    entry?.label ?? '',
                    entry?.materialNumber ?? ''
                ])
            );
        });
        const blob = new Blob(csv, { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, 'openCPQ.csv');
    }

    renderBOM(): ReactNode {
        return (
            <table className="cpq-bom-table">
                <colgroup>
                    <col className="cpq-bom-col-quantity" />
                    <col className="cpq-bom-col-item" />
                    <col className="cpq-bom-col-description" />
                    <col className="cpq-bom-col-material-number" />
                </colgroup>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item ID</th>
                        <th>Description</th>
                        <th>Material No.</th>
                    </tr>
                </thead>
                <tbody>
                    {this.__bom.empty() ? (
                        <tr>
                            <td colSpan={4}>
                                <div className="cpq-validate cpq-validate-info">
                                    (no entries)
                                </div>
                            </td>
                        </tr>
                    ) : (
                        this.__bom.mapItems((item, quantity) => {
                            const entry = this.__itemMap[item];
                            return (
                                <tr key={item}>
                                    <td className="cpq-bom-quantity">
                                        {quantity}
                                    </td>
                                    <td className="cpq-bom-item">{item}</td>
                                    <td className="cpq-bom-description">
                                        {entry?.label ?? '(missing)'}
                                    </td>
                                    <td className="cpq-bom-material-number">
                                        {entry?.materialNumber ?? '(missing)'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        );
    }
}

export function VBOM(itemList: BOMItemEntry[], ctx: { bom: NamedAdder }): View {
    const view = new BOMView('bom', itemList, ctx.bom);
    return new View('bom', () => view.render());
}

export function bomEntry(name: string, quantity: number, type: Type): Type {
    return sideEffect((_node, ctx) => {
        const bom = ctx.bom as NamedAdder;
        bom.add(name, quantity);
    }, type);
}

export { csvLine };
