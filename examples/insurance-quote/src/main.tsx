import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import {
    Root,
    CGroup,
    cmember,
    CInteger,
    CString,
    CSelect,
    ccase,
    cdefault,
    CEither,
    CPanel,
    CValidate,
    CSideEffect,
    CTabbedArea,
    CWorkbench,
    CLinearAggregation,
    SimpleAdder,
    rootPath,
    Problems,
    VProblems,
    View,
    type Ctx,
    type Node as CpqNode
} from "@cbnsndwch/opencpq";
import "@cbnsndwch/opencpq/styles.css";

/*
 * Insurance quote — showcases:
 *   - CTabbedArea for multi-step form
 *   - CValidate with error + warning modes (age gating, smoker warning)
 *   - Select case modes ("warning" / "error") that flag risky options
 *   - CLinearAggregation rollup for monthly premium
 *   - VProblems view that links back to the offending fields
 */

const BASE_PREMIUM = 42;

/* ---------- Personal information tab ---------- */

const PersonalInfoTab = CPanel(
    { header: "Tell us about yourself" },
    CGroup([
        cmember("name", "Full name", CString({ defaultValue: "" })),

        cmember(
            "age",
            "Age",
            CValidate(
                (_node, { error, warning }, ctx) => {
                    const raw = ctx.value;
                    const age = typeof raw === "string" ? parseInt(raw, 10) : NaN;
                    if (!raw) {
                        error("Age is required.");
                    } else if (isNaN(age)) {
                        error("Age must be a number.");
                    } else if (age < 18) {
                        error("Must be at least 18 years old.");
                    } else if (age > 80) {
                        warning(
                            "Premiums for applicants over 80 may require manual review."
                        );
                        (ctx.premium as SimpleAdder).add(45);
                    } else if (age > 60) {
                        (ctx.premium as SimpleAdder).add(25);
                    } else if (age > 40) {
                        (ctx.premium as SimpleAdder).add(10);
                    }
                },
                CInteger({ defaultValue: 30 })
            )
        ),

        cmember(
            "smoker",
            "Smoker",
            CValidate(
                (_node, { warning }, ctx) => {
                    const v = ctx.value as { $case?: boolean } | undefined;
                    if (v?.$case === true) {
                        warning("Smoker surcharge applied (+$30/mo).");
                        (ctx.premium as SimpleAdder).add(30);
                    }
                },
                CEither({ defaultValue: false })
            )
        ),

        cmember(
            "state",
            "State of residence",
            CSelect([
                cdefault(ccase("CA", "California")),
                ccase("NY", "New York"),
                ccase("TX", "Texas"),
                ccase("FL", "Florida"),
                { ...ccase("other", "Other"), mode: "warning" as const }
            ])
        )
    ])
);

/* ---------- Coverage tab ---------- */

const CoverageTab = CPanel(
    { header: "Choose your coverage" },
    CGroup([
        cmember(
            "plan",
            "Plan tier",
            CSelect([
                ccase(
                    "basic",
                    "Basic — $0/mo",
                    CSideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(0);
                    })
                ),
                cdefault(
                    ccase(
                        "standard",
                        "Standard — +$20/mo",
                        CSideEffect((_n, ctx) => {
                            (ctx.premium as SimpleAdder).add(20);
                        })
                    )
                ),
                ccase(
                    "premium",
                    "Premium — +$50/mo",
                    CSideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(50);
                    })
                ),
                ccase(
                    "platinum",
                    "Platinum — +$120/mo",
                    CSideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(120);
                    })
                )
            ])
        ),

        cmember(
            "deductible",
            "Deductible",
            CSelect([
                ccase(
                    "500",
                    "$500 — +$40/mo",
                    CSideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(40);
                    })
                ),
                cdefault(
                    ccase(
                        "1000",
                        "$1,000 — +$20/mo",
                        CSideEffect((_n, ctx) => {
                            (ctx.premium as SimpleAdder).add(20);
                        })
                    )
                ),
                ccase("2500", "$2,500 — included"),
                ccase(
                    "5000",
                    "$5,000 — -$15/mo",
                    CSideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(-15);
                    })
                )
            ])
        )
    ])
);

/* ---------- Add-ons tab ---------- */

function addon(
    code: string,
    label: string,
    monthly: number
): { name: string; type: ReturnType<typeof CEither> } {
    return {
        name: code,
        type: CEither(
            { defaultValue: false },
            CSideEffect((_n, ctx) => {
                (ctx.premium as SimpleAdder).add(monthly);
            })
        )
    };
}

const AddonsTab = CPanel(
    { header: "Optional add-ons" },
    CGroup([
        cmember("dental", "Dental ($15/mo)", addon("dental", "Dental", 15).type),
        cmember("vision", "Vision ($8/mo)", addon("vision", "Vision", 8).type),
        cmember(
            "maternity",
            "Maternity ($40/mo)",
            addon("maternity", "Maternity", 40).type
        ),
        cmember(
            "roadside",
            "Roadside assistance ($5/mo)",
            addon("roadside", "Roadside", 5).type
        ),
        cmember(
            "travel",
            "International travel ($18/mo)",
            addon("travel", "Travel", 18).type
        )
    ])
);

const ConfigurationType = CSideEffect(
    (_n, ctx) => {
        // Base premium always added once.
        (ctx.premium as SimpleAdder).add(BASE_PREMIUM);
    },
    CTabbedArea([
        cmember("personal", "👤 Personal", PersonalInfoTab),
        cmember("coverage", "🛡️ Coverage", CoverageTab),
        cmember("addons", "✨ Add-ons", AddonsTab)
    ])
);

const QuoteType = CLinearAggregation(
    "premium",
    SimpleAdder,
    CWorkbench(
        (ctx: Ctx) => [
            new View("premium", () => {
                const monthly = (ctx.premium as SimpleAdder).get();
                const annual = monthly * 12;
                return (
                    <div className="quote-card">
                        <div className="quote-label">Your quote</div>
                        <div className="quote-monthly">
                            ${monthly.toFixed(0)}
                            <span className="quote-period">/mo</span>
                        </div>
                        <div className="quote-annual">
                            ${annual.toLocaleString()} billed annually
                        </div>
                    </div>
                );
            }),
            VProblems({ problems: ctx.problems })
        ],
        (node: CpqNode, views: View[]): ReactNode => {
            const find = (name: string): View | undefined =>
                views.find(v => v.name === name);
            return (
                <div className="quote-layout">
                    <div className="quote-main">{node.render()}</div>
                    <aside className="quote-side">
                        {find("premium")?.render()}
                        <section className="side-section">
                            <h3>Problems</h3>
                            {find("problems")?.render()}
                        </section>
                    </aside>
                </div>
            );
        },
        ConfigurationType
    )
);

const styles = `
body { margin: 0; font-family: system-ui, sans-serif; background: #eff6ff; }
.quote-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; padding: 16px; max-width: 1100px; margin: 0 auto; }
.quote-main { background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.quote-side { display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; align-self: start; }
.side-section { background: #fff; padding: 12px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
.side-section h3 { margin: 0 0 8px 0; font-size: 0.95em; color: #374151; }
.quote-card { background: linear-gradient(135deg, #1d4ed8, #312e81); color: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(29,78,216,.35); }
.quote-label { font-size: 0.75em; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em; }
.quote-monthly { font-size: 2.4em; font-weight: 700; margin-top: 4px; }
.quote-period { font-size: 0.5em; font-weight: 400; opacity: 0.85; }
.quote-annual { font-size: 0.85em; opacity: 0.85; margin-top: 4px; }
@media (max-width: 900px) { .quote-layout { grid-template-columns: 1fr; } .quote-side { position: static; } }
`;

const container = document.getElementById("root");
if (container) {
    createRoot(container).render(
        <>
            <style>{styles}</style>
            <Root
                type={QuoteType}
                initialCtxProvider={() => ({
                    path: rootPath,
                    problems: new Problems()
                })}
            />
        </>
    );
}
