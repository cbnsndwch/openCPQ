import {
    Root,
    t,
    VBOM,
    SimpleAdder,
    NamedAdder,
    rootPath,
    Problems,
    VProblems,
    View,
    type Ctx,
    type Node as CpqNode,
    type Option
} from '@cbnsndwch/opencpq';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@cbnsndwch/opencpq/styles.css';

/*
 * Laptop builder — showcases:
 *   - Cascading t.select (CPU → compatible motherboards)
 *   - t.validate warning mode
 *   - BOM rollup via t.sideEffect + NamedAdder
 *   - t.linearAggregation for live price totalling
 *   - t.workbench showing configurator + BOM + problems + live price
 */

interface CpuInfo {
    label: string;
    price: number;
    tdp: number;
    chipsets: string[];
}

const CPUS: Record<string, CpuInfo> = {
    i5: {
        label: 'Intel Core i5-14600K',
        price: 319,
        tdp: 125,
        chipsets: ['b760', 'z790']
    },
    i7: {
        label: 'Intel Core i7-14700K',
        price: 419,
        tdp: 125,
        chipsets: ['b760', 'z790']
    },
    i9: {
        label: 'Intel Core i9-14900K',
        price: 589,
        tdp: 253,
        chipsets: ['z790']
    }
};

const CHIPSETS: Record<string, { label: string; price: number }> = {
    b760: { label: 'B760 motherboard', price: 180 },
    z790: { label: 'Z790 motherboard', price: 310 }
};

const RAM_KITS: Record<string, { label: string; price: number; gb: number }> = {
    '16': { label: '16 GB DDR5-5600', price: 75, gb: 16 },
    '32': { label: '32 GB DDR5-6000', price: 139, gb: 32 },
    '64': { label: '64 GB DDR5-6000', price: 289, gb: 64 },
    '128': { label: '128 GB DDR5-5200', price: 579, gb: 128 }
};

const STORAGE: Record<string, { label: string; price: number }> = {
    'ssd-1tb': { label: '1 TB NVMe SSD', price: 85 },
    'ssd-2tb': { label: '2 TB NVMe SSD', price: 169 },
    'ssd-4tb': { label: '4 TB NVMe SSD', price: 349 }
};

// A select case that records a BOM entry + price contribution on selection.
function partOption(code: string, label: string, price: number): Option {
    return t.option(
        code,
        `${label} — $${price}`,
        t.sideEffect((_node, ctx) => {
            (ctx.bom as NamedAdder).add(code, 1);
            (ctx.price as SimpleAdder).add(price);
        })
    );
}

function asDefault(c: Option, idx: number): Option {
    return idx === 0 ? t.defaultOption(c) : c;
}

const ConfigurationType = t.panel(
    { header: '💻 Build your laptop', collapsible: false },
    t.group([
        t.member('name', 'Build name', t.string({ defaultValue: 'My build' })),

        t.member(
            'cpu',
            'Processor',
            t.select([
                t.defaultOption(
                    partOption('i5', CPUS.i5!.label, CPUS.i5!.price)
                ),
                partOption('i7', CPUS.i7!.label, CPUS.i7!.price),
                partOption('i9', CPUS.i9!.label, CPUS.i9!.price)
            ])
        ),

        // Dependent member: receives the GROUP's ctx, so ctx.value is the full
        // group object and we can read the cpu selection to narrow chipsets.
        (groupCtx: Ctx) => {
            const groupVal = groupCtx.value as
                | { cpu?: { $option?: string } }
                | undefined;
            const cpuCode = groupVal?.cpu?.$option ?? 'i5';
            const cpu = CPUS[cpuCode] ?? CPUS.i5!;
            return t.member(
                'chipset',
                'Motherboard',
                t.select(
                    cpu.chipsets.map((code, i) => {
                        const info = CHIPSETS[code]!;
                        return asDefault(
                            partOption(code, info.label, info.price),
                            i
                        );
                    })
                )
            );
        },

        t.member(
            'ram',
            'Memory',
            t.validate(
                (_node, { warning }, ctx) => {
                    const v = (ctx.value as { $option?: string } | undefined)
                        ?.$option;
                    if (v === '16') {
                        warning(
                            '16 GB may be tight for modern workloads — consider 32 GB.'
                        );
                    }
                },
                t.select([
                    t.defaultOption(
                        partOption(
                            '16',
                            RAM_KITS['16']!.label,
                            RAM_KITS['16']!.price
                        )
                    ),
                    partOption(
                        '32',
                        RAM_KITS['32']!.label,
                        RAM_KITS['32']!.price
                    ),
                    partOption(
                        '64',
                        RAM_KITS['64']!.label,
                        RAM_KITS['64']!.price
                    ),
                    partOption(
                        '128',
                        RAM_KITS['128']!.label,
                        RAM_KITS['128']!.price
                    )
                ])
            )
        ),

        t.member(
            'storage',
            'Primary storage',
            t.select([
                t.defaultOption(
                    partOption(
                        'ssd-1tb',
                        STORAGE['ssd-1tb']!.label,
                        STORAGE['ssd-1tb']!.price
                    )
                ),
                partOption(
                    'ssd-2tb',
                    STORAGE['ssd-2tb']!.label,
                    STORAGE['ssd-2tb']!.price
                ),
                partOption(
                    'ssd-4tb',
                    STORAGE['ssd-4tb']!.label,
                    STORAGE['ssd-4tb']!.price
                )
            ])
        ),

        t.member(
            'touchscreen',
            'Touchscreen upgrade (+$120)',
            t.sideEffect((_node, ctx) => {
                if (ctx.value === true) {
                    (ctx.bom as NamedAdder).add('touchscreen', 1);
                    (ctx.price as SimpleAdder).add(120);
                }
            }, t.boolean())
        )
    ])
);

// BOM catalogue for the export view.
const BOM_ITEMS = [
    ...Object.entries(CPUS).map(([id, v]) => ({
        itemId: id,
        label: v.label,
        materialNumber: `CPU-${id.toUpperCase()}`
    })),
    ...Object.entries(CHIPSETS).map(([id, v]) => ({
        itemId: id,
        label: v.label,
        materialNumber: `MB-${id.toUpperCase()}`
    })),
    ...Object.entries(RAM_KITS).map(([id, v]) => ({
        itemId: id,
        label: v.label,
        materialNumber: `RAM-${id}GB`
    })),
    ...Object.entries(STORAGE).map(([id, v]) => ({
        itemId: id,
        label: v.label,
        materialNumber: `SSD-${id.replace('ssd-', '').toUpperCase()}`
    })),
    {
        itemId: 'touchscreen',
        label: 'Touchscreen display',
        materialNumber: 'DISP-TOUCH'
    }
];

const LaptopType = t.linearAggregation(
    'price',
    SimpleAdder,
    t.linearAggregation(
        'bom',
        NamedAdder,
        t.workbench(
            (ctx: Ctx) => [
                VBOM(BOM_ITEMS, ctx as unknown as { bom: NamedAdder }),
                VProblems({ problems: ctx.problems }),
                new View('price', () => (
                    <div className="price-card">
                        <div className="price-label">Total price</div>
                        <div className="price-value">
                            ${(ctx.price as SimpleAdder).get().toLocaleString()}
                        </div>
                    </div>
                ))
            ],
            (node: CpqNode, views: View[]): ReactNode => {
                const find = (name: string): View | undefined =>
                    views.find(v => v.name === name);
                return (
                    <div className="wb">
                        <div className="wb-main">{node.render()}</div>
                        <div className="wb-side">
                            {find('price')?.render()}
                            <section className="wb-section">
                                <h3>Bill of materials</h3>
                                {find('bom')?.render()}
                            </section>
                            <section className="wb-section">
                                <h3>Problems</h3>
                                {find('problems')?.render()}
                            </section>
                        </div>
                    </div>
                );
            },
            ConfigurationType
        )
    )
);

const styles = `
body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; }
.wb { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; padding: 16px; max-width: 1200px; margin: 0 auto; }
.wb-main { background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
.wb-side { display: flex; flex-direction: column; gap: 12px; }
.wb-section { background: #fff; padding: 12px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
.wb-section h3 { margin: 0 0 8px 0; font-size: 0.95em; color: #374151; }
.price-card { background: #111827; color: #fff; padding: 16px; border-radius: 8px; }
.price-label { font-size: 0.8em; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.05em; }
.price-value { font-size: 2em; font-weight: 600; margin-top: 4px; }
@media (max-width: 900px) { .wb { grid-template-columns: 1fr; } }
`;

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <>
            <style>{styles}</style>
            <Root
                type={LaptopType}
                initialCtxProvider={() => ({
                    path: rootPath,
                    problems: new Problems()
                })}
            />
        </>
    );
}
