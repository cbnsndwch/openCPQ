# @cbnsndwch/opencpq

> **This is a fork.** openCPQ was originally created by
> [webXcerpt Software GmbH](https://github.com/webXcerpt/openCPQ) and
> released under MIT in 2015. This package is a maintained fork by
> [cbnsndwch LLC](https://github.com/cbnsndwch). All credit for the
> library's conceptual core (the `Type`/`Node` visitor pattern, the
> declarative schema, aggregation rollups, quantification semantics, case
> modes, etc.) belongs to the upstream authors. The fork contributes a
> React 19 + TypeScript rewrite, modern tooling, and new example apps.
> See the
> [ACKNOWLEDGEMENTS](https://github.com/cbnsndwch/openCPQ/blob/master/ACKNOWLEDGEMENTS.md)
> file in the monorepo for full credit.

A headless React 19 library for building **in-browser product
configurators** (Configure / Price / Quote). You describe your product as a
declarative tree of `Type`s — selects, groups, tables, validations, BOM
rollups, SVG visualizations — and openCPQ renders it as an interactive
configurator with live constraints, undo/redo, and JSON serialization.

## Install

```bash
pnpm add @cbnsndwch/opencpq react react-dom
```

Peer dependencies: `react@^19` and `react-dom@^19`.

## Hello world

```tsx
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(
    <Root
        type={LaptopType}
        initialCtxProvider={() => ({
            path: rootPath,
            problems: new Problems()
        })}
    />
);
```

## What's in the box

### Core

All type factories and value helpers are exposed under a single `t`
namespace (as used above). Individual named exports are also available
for tree-shaking and advanced use.

- `Type` / `Node` with prototype-chain-based visitor dispatch
- `rootPath`, `Problems`, `serialize` / `deserialize` (handles aliased and
  circular structures)
- `SimpleAdder` / `NamedAdder` + `t.linearAggregation` / `t.multiplying`
  for rollups that propagate through the tree
- `t.sideEffect`, `t.namespace` / `t.named`, `t.op`

### Components

- Primitives: `t.string`, `t.textarea`, `t.integer`, `t.number`, `t.date`,
  `t.time`, `t.boolean`, `t.unit`
- Selection: `t.select` (with `plain` / `warning` / `error` / `hidden`
  option modes), `t.either`
- Structure: `t.group`, `t.table`, `t.fixedTable`, `t.panel`, `t.tabs`,
  `t.accordion`, `t.labeled`, `t.html`
- Validation: `t.validate`, `t.validationMessages`

### Domain

- `t.bomEntry` / `VBOM` — bill of materials with CSV export
- `t.quantified` / `t.quantifiedList` — multiplicative quantity logic
- `t.image` / `t.svgRoot` / `t.transform` / `t.wrapVisualization` — live
  SVG visualization composed alongside the data tree
- `t.tocEntry` / `VTOC` — table of contents

### App shells

- `Root` — full configurator with undo/redo (Ctrl-Z / Ctrl-Shift-Z),
  localStorage save/restore, and file import/export
- `EmbeddedRoot` — for configurators embedded via `postMessage`

## Headless evaluation / SSR

If you need server-side document rendering (quotes, proposals, BEOs) or
Worker-side evaluation, use `evaluate()` to run a type tree without mounting a
React root:

```tsx
import { evaluate, NamedAdder, SimpleAdder, t } from '@cbnsndwch/opencpq';
import { renderToStaticMarkup } from 'react-dom/server';

const totals = { price: new SimpleAdder(), bom: new NamedAdder() };
const type = t.quantified(
    t.sideEffect((_node, ctx) => {
        (ctx.price as SimpleAdder).add(100);
        (ctx.bom as NamedAdder).add('Line item', 1);
    })
);

const { node, problems, aggregators } = evaluate(
    type,
    { quantity: 2 },
    totals
);

const html = renderToStaticMarkup(node.render());
const totalPrice = aggregators.price.get();
const totalLines = aggregators.bom.get('Line item');
```

`evaluate()` seeds the root context with your aggregators and registers their
names in `linearAggregators`, so `t.multiplying` and `t.quantified` scale them
automatically. View registration happens at import time and is DOM-free, so the
same model can be evaluated and rendered in non-browser environments.

## Examples

The monorepo at
[github.com/cbnsndwch/openCPQ](https://github.com/cbnsndwch/openCPQ) ships
several example apps under `examples/` that each highlight a different
feature:

| Example           | Showcases                                                 |
| ----------------- | --------------------------------------------------------- |
| `basic`           | Primitives, `t.select`, `t.panel`, the `Root` shell        |
| `laptop-builder`  | Cascading selects, BOM rollup, live pricing, `t.workbench` |
| `pizza-builder`   | `t.either`, dual price + calorie rollups, validation       |
| `insurance-quote` | `t.tabs`, validation modes, problems view                  |
| `tshirt-designer` | Live SVG preview via `t.wrapVisualization`                 |

Clone the repo and run `pnpm --filter <example> dev` to try them.

## License

MIT.
© 2015 webXcerpt Software GmbH (original openCPQ) ·
© 2026 cbnsndwch LLC (fork and ongoing maintenance).
Both copyright notices are preserved in `LICENSE` as required by the MIT
License — please keep them if you redistribute.
