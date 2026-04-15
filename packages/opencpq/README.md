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
import { createRoot } from "react-dom/client";
import {
    Root,
    CGroup,
    cmember,
    CSelect,
    ccase,
    cdefault,
    CString,
    CBoolean,
    CPanel,
    rootPath,
    Problems
} from "@cbnsndwch/opencpq";
import "@cbnsndwch/opencpq/styles.css";

const LaptopType = CPanel(
    { header: "Build your laptop" },
    CGroup([
        cmember(
            "name",
            "Config name",
            CString({ defaultValue: "My laptop" })
        ),
        cmember(
            "cpu",
            "CPU",
            CSelect([
                cdefault(ccase("i5", "Intel Core i5")),
                ccase("i7", "Intel Core i7"),
                ccase("i9", "Intel Core i9")
            ])
        ),
        cmember("touchscreen", "Touchscreen", CBoolean())
    ])
);

createRoot(document.getElementById("root")!).render(
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

- `Type` / `Node` with prototype-chain-based visitor dispatch
- `rootPath`, `Problems`, `serialize` / `deserialize` (handles aliased and
  circular structures)
- `SimpleAdder` / `NamedAdder` + `CLinearAggregation` / `CMultiplying` for
  rollups that propagate through the tree
- `CSideEffect`, `CNameSpace` / `CNamed`, `COp`

### Components

- Primitives: `CString`, `CTextarea`, `CInteger`, `CNumber`, `CDate`,
  `CTime`, `CBoolean`, `CUnit`
- Selection: `CSelect` (with `plain` / `warning` / `error` / `hidden`
  modes), `CEither`
- Structure: `CGroup`, `CTable`, `CFixedTable`, `CPanel`, `CTabbedArea`,
  `CAccordion`, `CLabeled`, `CHtml`
- Validation: `CValidate`, `CValidationMessages`

### Domain

- `CBOMEntry` / `VBOM` — bill of materials with CSV export
- `CQuantified` / `CQuantifiedList` — multiplicative quantity logic
- `CImage` / `CSVGRoot` / `CTransform` / `CWrapVisualization` — live SVG
  visualization composed alongside the data tree
- `CTOCEntry` / `VTOC` — table of contents

### App shells

- `Root` — full configurator with undo/redo (Ctrl-Z / Ctrl-Shift-Z),
  localStorage save/restore, and file import/export
- `EmbeddedRoot` — for configurators embedded via `postMessage`

## Examples

The monorepo at
[github.com/cbnsndwch/openCPQ](https://github.com/cbnsndwch/openCPQ) ships
several example apps under `examples/` that each highlight a different
feature:

| Example | Showcases |
|---|---|
| `basic` | Primitives, `CSelect`, `CPanel`, the `Root` shell |
| `laptop-builder` | Cascading selects, BOM rollup, live pricing, `CWorkbench` |
| `pizza-builder` | `CEither`, dual price + calorie rollups, validation |
| `insurance-quote` | `CTabbedArea`, validation modes, problems view |
| `tshirt-designer` | Live SVG preview via `CWrapVisualization` |

Clone the repo and run `pnpm --filter <example> dev` to try them.

## License

MIT.
© 2015 webXcerpt Software GmbH (original openCPQ) ·
© 2026 cbnsndwch LLC (fork and ongoing maintenance).
Both copyright notices are preserved in `LICENSE` as required by the MIT
License — please keep them if you redistribute.
