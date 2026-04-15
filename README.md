# openCPQ

> **This is a fork.** openCPQ was originally created by
> [webXcerpt Software GmbH](https://github.com/webXcerpt/openCPQ) and
> released under MIT in 2015. This repository is a maintained fork by
> [cbnsndwch LLC](https://github.com/cbnsndwch), published to npm as
> [`@cbnsndwch/opencpq`](https://www.npmjs.com/package/@cbnsndwch/opencpq).
> See [ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md) for full credit to the
> upstream authors and an overview of what the fork changed.

A headless React 19 library for building **in-browser product configurators**
(Configure / Price / Quote).

You describe your product as a declarative tree of `Type`s — selects,
groups, tables, validations, BOM rollups, SVG visualizations — and openCPQ
renders it as an interactive configurator with live constraints, undo/redo,
and JSON serialization. The core is framework-agnostic logic; the UI layer
is thin, overridable React components with CSS-class-only styling.

This repository is a **pnpm + Turbo monorepo** containing the
[`@cbnsndwch/opencpq`](./packages/opencpq) library and a handful of example
apps that demonstrate how to compose the primitives.

## Repository layout

```
packages/
    opencpq/                  → @cbnsndwch/opencpq (the library)
examples/
    basic/                    → smallest useful configurator
    laptop-builder/           → cascading selects + BOM + live pricing
    pizza-builder/            → t.either + t.quantifiedList + calorie & price rollup
    insurance-quote/          → t.tabs + t.validate modes + problems view
    tshirt-designer/          → live SVG preview via t.wrapVisualization
.changeset/                   → pending version bumps
.github/workflows/            → CI (lint/typecheck/test/build) + release
tsconfig.base.json            → shared strict TS config
turbo.json                    → pipeline
pnpm-workspace.yaml
```

## Getting started

```bash
pnpm install

# Run any example in dev mode
pnpm --filter @cbnsndwch/opencpq-example-laptop-builder dev
pnpm --filter @cbnsndwch/opencpq-example-pizza-builder dev
pnpm --filter @cbnsndwch/opencpq-example-insurance-quote dev
pnpm --filter @cbnsndwch/opencpq-example-tshirt-designer dev
pnpm --filter @cbnsndwch/opencpq-example-basic dev

# Workspace-wide tasks via Turbo (cached, parallel)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Each example aliases `@cbnsndwch/opencpq` to the library's TypeScript source
in its `vite.config.ts`, so editing the library hot-reloads everywhere with
no build step required.

## The library in 30 lines

```tsx
import { Root, t, rootPath, Problems } from '@cbnsndwch/opencpq';
import '@cbnsndwch/opencpq/styles.css';

const LaptopType = t.panel(
    { header: 'Build your laptop' },
    t.group([
        t.member('name', 'Config name', t.string({ defaultValue: 'My laptop' })),
        t.member(
            'cpu',
            'CPU',
            t.select([
                t.defaultOption(t.option('i5', 'Intel Core i5')),
                t.option('i7', 'Intel Core i7'),
                t.option('i9', 'Intel Core i9')
            ])
        ),
        t.member('touchscreen', 'Touchscreen', t.boolean())
    ])
);

<Root
    type={LaptopType}
    initialCtxProvider={() => ({
        path: rootPath,
        problems: new Problems()
    })}
/>;
```

## Example apps

| Example             | Showcases                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **basic**           | Primitives, `t.select`, `t.panel`, `t.group`, the `Root` shell                                                                                                                                                                  |
| **laptop-builder**  | Cascading selects (CPU → motherboard), `t.validate` warning mode, BOM rollup via `t.sideEffect`, dual `t.linearAggregation` for price, `t.workbench` with a three-panel layout (config + BOM + problems + live price)           |
| **pizza-builder**   | `t.either` for dietary flags, `t.validate` error mode (too many toppings), two parallel `t.linearAggregation` rollups (price + calories), sticky summary card                                                                   |
| **insurance-quote** | `t.tabs` for a multi-step form, per-field `t.validate` with error and warning modes, option modes in `t.select` to flag risky picks, live monthly/annual premium card, `VProblems` view linked back to offending fields         |
| **tshirt-designer** | `t.wrapVisualization` + `t.sideEffect` building a live SVG preview from the current config, BOM + pricing rollups alongside the visualization                                                                                   |

## Versioning & publishing

Versioning is managed with
[Changesets](https://github.com/changesets/changesets).

```bash
# Add a changeset alongside your PR
pnpm changeset
```

CI verifies every PR (lint, typecheck, test, build) on Node 20 and 22.
On merges to `master`, the Release workflow opens or updates a
“Version Packages” PR that aggregates pending changesets. Merging that PR
bumps versions, regenerates changelogs, and publishes `@cbnsndwch/opencpq`
to npm with provenance. Example apps are private and never published.

## Stack

- **React 19** (peer dependency)
- **TypeScript 5.7** — strict mode everywhere
- **Dual ESM** build via `tsup` with `.d.ts`
- **pnpm workspaces** + **Turbo** for the monorepo pipeline
- **Vitest** + jsdom for tests
- **oxlint** + **oxfmt** for linting and formatting
- **Changesets** for versioning, **GitHub Actions** for CI/release
- Node 20+

## Credits

See [ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md) — all credit for the
library's conceptual core goes to the upstream authors at webXcerpt.

## License

MIT.
© 2015 webXcerpt Software GmbH (original openCPQ) ·
© 2026 cbnsndwch LLC (fork and ongoing maintenance).
Both copyright notices are preserved in [LICENSE](./LICENSE) as required by
the MIT License — please keep them if you redistribute.
