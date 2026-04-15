import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import {
    Root,
    CGroup,
    cmember,
    CString,
    CSelect,
    ccase,
    cdefault,
    CPanel,
    CSideEffect,
    CWrapVisualization,
    CWorkbench,
    CLinearAggregation,
    SimpleAdder,
    NamedAdder,
    Visualization,
    rootPath,
    Problems,
    View,
    type Ctx,
    type Node as CpqNode,
    type Renderable
} from "@cbnsndwch/opencpq";
import "@cbnsndwch/opencpq/styles.css";

/*
 * T-shirt designer — showcases:
 *   - CWrapVisualization to compose an SVG tree alongside the data tree
 *   - CSideEffect to add SVG primitives to the visualization container
 *   - Live preview driven by the configuration state
 *   - BOM + pricing rollup alongside the visualization
 */

const COLORS: Record<string, { label: string; fill: string; price: number }> = {
    white: { label: "White", fill: "#f9fafb", price: 0 },
    black: { label: "Black", fill: "#111827", price: 0 },
    navy: { label: "Navy", fill: "#1e3a8a", price: 0 },
    red: { label: "Red", fill: "#b91c1c", price: 0 },
    forest: { label: "Forest green", fill: "#166534", price: 2 },
    mustard: { label: "Mustard", fill: "#ca8a04", price: 2 }
};

const SIZES: Record<string, { label: string; price: number }> = {
    S: { label: "S", price: 0 },
    M: { label: "M", price: 0 },
    L: { label: "L", price: 0 },
    XL: { label: "XL", price: 2 },
    XXL: { label: "XXL", price: 4 }
};

const PRINTS: Record<
    string,
    { label: string; draw: (color: string) => ReactNode; price: number }
> = {
    none: {
        label: "No print",
        draw: () => null,
        price: 0
    },
    star: {
        label: "Star",
        draw: (color: string) => (
            <polygon
                points="100,60 115,95 153,95 123,117 135,152 100,131 65,152 77,117 47,95 85,95"
                fill={color}
            />
        ),
        price: 5
    },
    heart: {
        label: "Heart",
        draw: (color: string) => (
            <path
                d="M100 150 C 60 110, 60 80, 85 80 C 95 80, 100 88, 100 95 C 100 88, 105 80, 115 80 C 140 80, 140 110, 100 150 Z"
                fill={color}
            />
        ),
        price: 5
    },
    text: {
        label: "Custom text",
        draw: (color: string) => (
            <text
                x="100"
                y="120"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize="20"
                fontWeight="700"
                fill={color}
            >
                OPEN CPQ
            </text>
        ),
        price: 8
    }
};

const INK_COLORS: Record<string, { label: string; fill: string }> = {
    white: { label: "White ink", fill: "#f9fafb" },
    black: { label: "Black ink", fill: "#111827" },
    gold: { label: "Gold ink", fill: "#facc15" },
    silver: { label: "Silver ink", fill: "#d1d5db" }
};

// Helper: make a renderable from a React node.
function renderableOf(render: () => ReactNode): Renderable {
    return { render };
}

// Draws the t-shirt silhouette. Always added as the base layer.
function shirtSilhouette(fill: string): Renderable {
    return renderableOf(() => (
        <g>
            <path
                d="M 50 40 L 20 70 L 40 100 L 55 85 L 55 200 L 145 200 L 145 85 L 160 100 L 180 70 L 150 40 L 130 30 Q 100 55 70 30 Z"
                fill={fill}
                stroke="#374151"
                strokeWidth="1.5"
            />
        </g>
    ));
}

// Draws the selected print with the selected ink color.
function printOverlay(
    printCode: string,
    inkColor: string
): Renderable {
    return renderableOf(() => {
        const p = PRINTS[printCode];
        if (!p) return null;
        return p.draw(inkColor);
    });
}

const ConfigurationType = CPanel(
    { header: "👕 Design your t-shirt", collapsible: false },
    CGroup([
        cmember("name", "Design name", CString({ defaultValue: "My tee" })),

        cmember(
            "color",
            "Shirt color",
            CSelect(
                Object.entries(COLORS).map(([code, info], i) => {
                    const c = ccase(
                        code,
                        `${info.label}${info.price > 0 ? ` (+$${info.price})` : ""}`,
                        CSideEffect((_n, ctx) => {
                            (ctx.price as SimpleAdder).add(info.price);
                            (ctx.bom as NamedAdder).add(`shirt-${code}`, 1);
                            (ctx.visualization as Visualization).add(
                                shirtSilhouette(info.fill)
                            );
                        })
                    );
                    return i === 1 ? cdefault(c) : c;
                })
            )
        ),

        cmember(
            "size",
            "Size",
            CSelect(
                Object.entries(SIZES).map(([code, info], i) => {
                    const c = ccase(
                        code,
                        `${info.label}${info.price > 0 ? ` (+$${info.price})` : ""}`,
                        CSideEffect((_n, ctx) => {
                            (ctx.price as SimpleAdder).add(info.price);
                            (ctx.bom as NamedAdder).add(`size-${code}`, 1);
                        })
                    );
                    return i === 2 ? cdefault(c) : c;
                })
            )
        ),

        cmember(
            "print",
            "Print",
            CSelect(
                Object.entries(PRINTS).map(([code, info]) => {
                    const c = ccase(
                        code,
                        `${info.label}${info.price > 0 ? ` (+$${info.price})` : ""}`,
                        CSideEffect((_n, ctx) => {
                            (ctx.price as SimpleAdder).add(info.price);
                            if (code !== "none") {
                                (ctx.bom as NamedAdder).add(`print-${code}`, 1);
                            }
                            // Register the print draw-fn on ctx so the ink-color
                            // member can assemble the overlay.
                            (
                                ctx as unknown as { _printCode: string }
                            )._printCode = code;
                        })
                    );
                    return code === "none" ? cdefault(c) : c;
                })
            )
        ),

        cmember(
            "inkColor",
            "Ink color",
            CSelect(
                Object.entries(INK_COLORS).map(([code, info], i) => {
                    const c = ccase(
                        code,
                        info.label,
                        CSideEffect((_n, ctx) => {
                            const printCode =
                                (ctx as unknown as { _printCode?: string })
                                    ._printCode ?? "none";
                            (ctx.visualization as Visualization).add(
                                printOverlay(printCode, info.fill)
                            );
                        })
                    );
                    return i === 0 ? cdefault(c) : c;
                })
            )
        )
    ])
);

// Shirt price starts at $18.
const TshirtType = CSideEffect(
    (_n, ctx) => {
        (ctx.price as SimpleAdder).add(18);
    },
    CLinearAggregation(
        "price",
        SimpleAdder,
        CLinearAggregation(
            "bom",
            NamedAdder,
            CWrapVisualization(
                (children: ReactNode[]): ReactNode => (
                    <svg
                        viewBox="0 0 200 220"
                        width="100%"
                        style={{ maxWidth: 320 }}
                    >
                        {children}
                    </svg>
                ),
                CWorkbench(
                    (ctx: Ctx) => [
                        new View("preview", () =>
                            (ctx.visualization as Visualization).render()
                        ),
                        new View("price", () => {
                            const price = (ctx.price as SimpleAdder).get();
                            return (
                                <div className="tee-price">
                                    <div className="tee-price-label">Total</div>
                                    <div className="tee-price-value">
                                        ${price.toFixed(2)}
                                    </div>
                                </div>
                            );
                        }),
                        new View("bom", () => {
                            const bom = ctx.bom as NamedAdder;
                            const rows = bom.mapItems(
                                (name, qty) => ({ name, qty }),
                                { sorted: true }
                            );
                            return rows.length === 0 ? (
                                <div className="tee-empty">
                                    (no items yet)
                                </div>
                            ) : (
                                <ul className="tee-bom">
                                    {rows.map(({ name, qty }) => (
                                        <li key={name}>
                                            <span className="tee-bom-qty">
                                                ×{qty}
                                            </span>{" "}
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            );
                        })
                    ],
                    (node: CpqNode, views: View[]): ReactNode => {
                        const find = (name: string): View | undefined =>
                            views.find(v => v.name === name);
                        return (
                            <div className="tee-layout">
                                <div className="tee-main">{node.render()}</div>
                                <aside className="tee-side">
                                    <div className="tee-preview">
                                        {find("preview")?.render()}
                                    </div>
                                    {find("price")?.render()}
                                    <section className="tee-section">
                                        <h3>Bill of materials</h3>
                                        {find("bom")?.render()}
                                    </section>
                                </aside>
                            </div>
                        );
                    },
                    ConfigurationType
                )
            )
        )
    )
);

const styles = `
body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f4; }
.tee-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 1fr); gap: 16px; padding: 16px; max-width: 1100px; margin: 0 auto; }
.tee-main { background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.tee-side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; align-self: start; }
.tee-preview { background: #fff; padding: 16px; border-radius: 12px; display: flex; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.tee-price { background: #111827; color: #fff; padding: 16px 20px; border-radius: 12px; display: flex; align-items: baseline; justify-content: space-between; }
.tee-price-label { font-size: 0.8em; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.05em; }
.tee-price-value { font-size: 1.8em; font-weight: 700; }
.tee-section { background: #fff; padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.tee-section h3 { margin: 0 0 8px 0; font-size: 0.9em; color: #374151; }
.tee-bom { list-style: none; padding: 0; margin: 0; font-size: 0.9em; }
.tee-bom li { padding: 2px 0; color: #4b5563; }
.tee-bom-qty { display: inline-block; min-width: 2em; color: #111827; font-weight: 600; }
.tee-empty { color: #9ca3af; font-style: italic; font-size: 0.9em; }
@media (max-width: 900px) { .tee-layout { grid-template-columns: 1fr; } .tee-side { position: static; } }
`;

const container = document.getElementById("root");
if (container) {
    createRoot(container).render(
        <>
            <style>{styles}</style>
            <Root
                type={TshirtType}
                initialCtxProvider={() => ({
                    path: rootPath,
                    problems: new Problems(),
                    visualization: new Visualization()
                })}
            />
        </>
    );
}
