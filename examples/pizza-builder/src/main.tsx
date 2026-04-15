import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import {
    Root,
    CGroup,
    cmember,
    CSelect,
    ccase,
    cdefault,
    CEither,
    CPanel,
    CSideEffect,
    CValidate,
    CWorkbench,
    CLinearAggregation,
    SimpleAdder,
    rootPath,
    Problems,
    View,
    type Ctx,
    type Node as CpqNode
} from "@cbnsndwch/opencpq";
import "@cbnsndwch/opencpq/styles.css";

/*
 * Pizza builder — showcases:
 *   - CEither for dietary choices (vegan / gluten-free)
 *   - Two parallel CLinearAggregation rollups (price + calories)
 *   - CValidate with error mode (too many toppings)
 *   - CWorkbench rendering live nutrition / price card
 */

interface PartInfo {
    label: string;
    price: number;
    kcal: number;
}

const SIZES: Record<string, PartInfo> = {
    small: { label: "Small (10\")", price: 9, kcal: 800 },
    medium: { label: "Medium (12\")", price: 12, kcal: 1100 },
    large: { label: "Large (14\")", price: 15, kcal: 1500 },
    xl: { label: "XL (16\")", price: 18, kcal: 1900 }
};

const SAUCES: Record<string, PartInfo> = {
    tomato: { label: "Classic tomato", price: 0, kcal: 40 },
    bbq: { label: "BBQ", price: 1, kcal: 90 },
    white: { label: "Garlic white sauce", price: 2, kcal: 120 },
    pesto: { label: "Basil pesto", price: 2, kcal: 150 }
};

const CHEESES: Record<string, PartInfo> = {
    mozzarella: { label: "Mozzarella", price: 0, kcal: 220 },
    "four-cheese": { label: "Four-cheese blend", price: 3, kcal: 340 },
    vegan: { label: "Plant-based mozzarella", price: 4, kcal: 180 },
    none: { label: "No cheese", price: -2, kcal: 0 }
};

const TOPPINGS: Record<string, PartInfo> = {
    pepperoni: { label: "Pepperoni", price: 2, kcal: 140 },
    sausage: { label: "Italian sausage", price: 2.5, kcal: 160 },
    mushroom: { label: "Mushrooms", price: 1.5, kcal: 30 },
    olive: { label: "Black olives", price: 1.5, kcal: 50 },
    pepper: { label: "Bell peppers", price: 1.5, kcal: 25 },
    onion: { label: "Red onion", price: 1, kcal: 20 },
    pineapple: { label: "Pineapple", price: 2, kcal: 60 },
    jalapeno: { label: "Jalapeños", price: 1.5, kcal: 15 }
};

function partCase<K extends string>(
    code: K,
    catalogue: Record<K, PartInfo>
): ReturnType<typeof ccase> {
    const info = catalogue[code];
    const priceLabel =
        info.price === 0
            ? ""
            : info.price > 0
              ? ` (+$${info.price})`
              : ` (-$${Math.abs(info.price)})`;
    return ccase(
        code,
        `${info.label}${priceLabel}`,
        CSideEffect((_node, ctx) => {
            (ctx.price as SimpleAdder).add(info.price);
            (ctx.kcal as SimpleAdder).add(info.kcal);
        })
    );
}

const SizeSelect = CSelect([
    partCase("small", SIZES),
    cdefault(partCase("medium", SIZES)),
    partCase("large", SIZES),
    partCase("xl", SIZES)
]);

const SauceSelect = CSelect([
    cdefault(partCase("tomato", SAUCES)),
    partCase("bbq", SAUCES),
    partCase("white", SAUCES),
    partCase("pesto", SAUCES)
]);

const CheeseSelect = CSelect([
    cdefault(partCase("mozzarella", CHEESES)),
    partCase("four-cheese", CHEESES),
    partCase("vegan", CHEESES),
    partCase("none", CHEESES)
]);

// Toppings: each is an on/off CEither that adds its price/kcal when enabled.
const ToppingsGroup = CPanel(
    { header: "🫑 Toppings (max 6)", collapsible: true, defaultOpen: true },
    CValidate(
        (_node, { error, info }, ctx) => {
            const toppings = (ctx.value ?? {}) as Record<
                string,
                { $case?: boolean } | undefined
            >;
            const enabled = Object.entries(toppings).filter(
                ([_, v]) => v?.$case === true
            ).length;
            if (enabled > 6) {
                error(`Too many toppings: ${enabled}. Max 6 for structural integrity.`);
            } else if (enabled > 0) {
                info(`${enabled} topping${enabled === 1 ? "" : "s"} selected.`);
            }
        },
        CGroup(
            Object.entries(TOPPINGS).map(([code, info]) =>
                cmember(
                    code,
                    `${info.label} ($${info.price} / ${info.kcal} kcal)`,
                    CEither(
                        { defaultValue: false },
                        // thenType runs when enabled — add price/kcal
                        CSideEffect((_node, ctx) => {
                            (ctx.price as SimpleAdder).add(info.price);
                            (ctx.kcal as SimpleAdder).add(info.kcal);
                        })
                    )
                )
            )
        )
    )
);

const DietaryPanel = CPanel(
    { header: "🌱 Dietary", collapsible: true, defaultOpen: false },
    CGroup([
        cmember(
            "glutenFree",
            "Gluten-free crust (+$3)",
            CEither(
                { defaultValue: false },
                CSideEffect((_node, ctx) => {
                    (ctx.price as SimpleAdder).add(3);
                })
            )
        ),
        cmember(
            "extraCheese",
            "Extra cheese (+$2, +200 kcal)",
            CEither(
                { defaultValue: false },
                CSideEffect((_node, ctx) => {
                    (ctx.price as SimpleAdder).add(2);
                    (ctx.kcal as SimpleAdder).add(200);
                })
            )
        )
    ])
);

const ConfigurationType = CPanel(
    { header: "🍕 Build your pizza", collapsible: false },
    CGroup([
        cmember("size", "Size", SizeSelect),
        cmember("sauce", "Sauce", SauceSelect),
        cmember("cheese", "Cheese", CheeseSelect),
        cmember("toppings", "", ToppingsGroup),
        cmember("dietary", "", DietaryPanel)
    ])
);

const PizzaType = CLinearAggregation(
    "price",
    SimpleAdder,
    CLinearAggregation(
        "kcal",
        SimpleAdder,
        CWorkbench(
            (ctx: Ctx) => [
                new View("summary", () => {
                    const price = (ctx.price as SimpleAdder).get();
                    const kcal = (ctx.kcal as SimpleAdder).get();
                    return (
                        <div className="summary-card">
                            <div className="metric">
                                <div className="metric-label">Price</div>
                                <div className="metric-value">
                                    ${price.toFixed(2)}
                                </div>
                            </div>
                            <div className="metric">
                                <div className="metric-label">Calories</div>
                                <div className="metric-value">
                                    {kcal.toLocaleString()}
                                    <span className="unit"> kcal</span>
                                </div>
                            </div>
                        </div>
                    );
                })
            ],
            (node: CpqNode, views: View[]): ReactNode => (
                <div className="pizza-layout">
                    <div className="pizza-main">{node.render()}</div>
                    <aside className="pizza-side">
                        {views.find(v => v.name === "summary")?.render()}
                    </aside>
                </div>
            ),
            ConfigurationType
        )
    )
);

const styles = `
body { margin: 0; font-family: system-ui, sans-serif; background: #fef3c7; }
.pizza-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; padding: 16px; max-width: 1100px; margin: 0 auto; }
.pizza-main { background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.pizza-side { position: sticky; top: 16px; align-self: start; }
.summary-card { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px; }
.metric { }
.metric-label { font-size: 0.75em; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; }
.metric-value { font-size: 1.8em; font-weight: 700; margin-top: 2px; }
.unit { font-size: 0.5em; opacity: 0.7; font-weight: 400; }
@media (max-width: 900px) { .pizza-layout { grid-template-columns: 1fr; } .pizza-side { position: static; } }
`;

const container = document.getElementById("root");
if (container) {
    createRoot(container).render(
        <>
            <style>{styles}</style>
            <Root
                type={PizzaType}
                initialCtxProvider={() => ({
                    path: rootPath,
                    problems: new Problems()
                })}
            />
        </>
    );
}
