import {
    Root,
    t,
    SimpleAdder,
    rootPath,
    Problems,
    VProblems,
    View,
    type Ctx,
    type Node as CpqNode
} from '@cbnsndwch/opencpq';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '@cbnsndwch/opencpq/styles.css';

/*
 * Insurance quote — showcases:
 *   - t.tabs for multi-step form
 *   - t.validate with error + warning modes (age gating, smoker warning)
 *   - Select option modes ("warning" / "error") that flag risky options
 *   - t.linearAggregation rollup for monthly premium
 *   - VProblems view that links back to the offending fields
 */

const BASE_PREMIUM = 42;

/* ---------- Personal information tab ---------- */

const PersonalInfoTab = t.panel(
    { header: 'Tell us about yourself' },
    t.group([
        t.member('name', 'Full name', t.string({ defaultValue: '' })),

        t.member(
            'age',
            'Age',
            t.validate(
                (_node, { error, warning }, ctx) => {
                    const raw = ctx.value;
                    const age =
                        typeof raw === 'string' ? parseInt(raw, 10) : NaN;
                    if (!raw) {
                        error('Age is required.');
                    } else if (isNaN(age)) {
                        error('Age must be a number.');
                    } else if (age < 18) {
                        error('Must be at least 18 years old.');
                    } else if (age > 80) {
                        warning(
                            'Premiums for applicants over 80 may require manual review.'
                        );
                        (ctx.premium as SimpleAdder).add(45);
                    } else if (age > 60) {
                        (ctx.premium as SimpleAdder).add(25);
                    } else if (age > 40) {
                        (ctx.premium as SimpleAdder).add(10);
                    }
                },
                t.integer({ defaultValue: 30 })
            )
        ),

        t.member(
            'smoker',
            'Smoker',
            t.validate(
                (_node, { warning }, ctx) => {
                    const v = ctx.value as { $option?: boolean } | undefined;
                    if (v?.$option === true) {
                        warning('Smoker surcharge applied (+$30/mo).');
                        (ctx.premium as SimpleAdder).add(30);
                    }
                },
                t.either({ defaultValue: false })
            )
        ),

        t.member(
            'state',
            'State of residence',
            t.select([
                t.defaultOption(t.option('CA', 'California')),
                t.option('NY', 'New York'),
                t.option('TX', 'Texas'),
                t.option('FL', 'Florida'),
                { ...t.option('other', 'Other'), mode: 'warning' as const }
            ])
        )
    ])
);

/* ---------- Coverage tab ---------- */

const CoverageTab = t.panel(
    { header: 'Choose your coverage' },
    t.group([
        t.member(
            'plan',
            'Plan tier',
            t.select([
                t.option(
                    'basic',
                    'Basic — $0/mo',
                    t.sideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(0);
                    })
                ),
                t.defaultOption(
                    t.option(
                        'standard',
                        'Standard — +$20/mo',
                        t.sideEffect((_n, ctx) => {
                            (ctx.premium as SimpleAdder).add(20);
                        })
                    )
                ),
                t.option(
                    'premium',
                    'Premium — +$50/mo',
                    t.sideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(50);
                    })
                ),
                t.option(
                    'platinum',
                    'Platinum — +$120/mo',
                    t.sideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(120);
                    })
                )
            ])
        ),

        t.member(
            'deductible',
            'Deductible',
            t.select([
                t.option(
                    '500',
                    '$500 — +$40/mo',
                    t.sideEffect((_n, ctx) => {
                        (ctx.premium as SimpleAdder).add(40);
                    })
                ),
                t.defaultOption(
                    t.option(
                        '1000',
                        '$1,000 — +$20/mo',
                        t.sideEffect((_n, ctx) => {
                            (ctx.premium as SimpleAdder).add(20);
                        })
                    )
                ),
                t.option('2500', '$2,500 — included'),
                t.option(
                    '5000',
                    '$5,000 — -$15/mo',
                    t.sideEffect((_n, ctx) => {
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
): { name: string; type: ReturnType<typeof t.either> } {
    return {
        name: code,
        type: t.either(
            { defaultValue: false },
            t.sideEffect((_n, ctx) => {
                (ctx.premium as SimpleAdder).add(monthly);
            })
        )
    };
}

const AddonsTab = t.panel(
    { header: 'Optional add-ons' },
    t.group([
        t.member(
            'dental',
            'Dental ($15/mo)',
            addon('dental', 'Dental', 15).type
        ),
        t.member('vision', 'Vision ($8/mo)', addon('vision', 'Vision', 8).type),
        t.member(
            'maternity',
            'Maternity ($40/mo)',
            addon('maternity', 'Maternity', 40).type
        ),
        t.member(
            'roadside',
            'Roadside assistance ($5/mo)',
            addon('roadside', 'Roadside', 5).type
        ),
        t.member(
            'travel',
            'International travel ($18/mo)',
            addon('travel', 'Travel', 18).type
        )
    ])
);

const ConfigurationType = t.sideEffect(
    (_n, ctx) => {
        // Base premium always added once.
        (ctx.premium as SimpleAdder).add(BASE_PREMIUM);
    },
    t.tabs([
        t.member('personal', '👤 Personal', PersonalInfoTab),
        t.member('coverage', '🛡️ Coverage', CoverageTab),
        t.member('addons', '✨ Add-ons', AddonsTab)
    ])
);

const QuoteType = t.linearAggregation(
    'premium',
    SimpleAdder,
    t.workbench(
        (ctx: Ctx) => [
            new View('premium', () => {
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
                        {find('premium')?.render()}
                        <section className="side-section">
                            <h3>Problems</h3>
                            {find('problems')?.render()}
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

const container = document.getElementById('root');
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
