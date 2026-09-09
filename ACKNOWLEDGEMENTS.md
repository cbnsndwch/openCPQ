# Acknowledgements

## openCPQ (upstream)

openCPQ was originally conceived and built by
[**webXcerpt Software GmbH**](http://webxcerpt.com) and released as open
source under MIT in 2015. The upstream repository lives at:

- [github.com/webXcerpt/openCPQ](https://github.com/webXcerpt/openCPQ)

All credit for the conceptual core of this library belongs to the original
authors. In particular:

- The **`Type` / `Node` visitor pattern** — types are factories, nodes are
  runtime instances, and `Node.visit(visitor)` dispatches by walking the
  prototype chain and matching class names. This is the spine of everything
  the library does and it comes from the original design, unchanged.
- The **context-threaded `makeNode(ctx)` model** that lets aggregators,
  validators, and BOM sinks flow top-down through the configuration tree
  without React context.
- **`CLinearAggregation` / `CMultiplying`** for numeric rollups that
  propagate multiplication factors (e.g. "this is a quantity of 3") through
  sub-trees.
- **`CSelect` case modes** (`plain` / `warning` / `error` / `hidden`) that
  let a configuration surface soft-invalid choices instead of hiding them.
- **`CQuantified` / `CQuantifiedList`** for the "N × item" quantity
  semantics that make bill-of-materials style configurators possible.
- **The `Problems` sink** — a structured list of validation messages that
  any node can append to, with deep-linkable fragment IDs.
- The **serialize/deserialize format** for complex JS data structures
  including aliased and circular references.

The upstream repository also ships the original example configurators that
illustrate the library's intent far better than prose:

- [openCPQ-example-optical-transport](https://github.com/webXcerpt/openCPQ-example-optical-transport)
- [openCPQ-example-components](https://github.com/webXcerpt/openCPQ-example-components)

And the `doc/presentations` folder in upstream contains the original
conference talks introducing openCPQ at MunichJS (2015) and CWG Prague
(2015).

If you're evaluating this library, the upstream talks and examples are
still the best starting point for understanding _why_ openCPQ is shaped the
way it is.

## This fork

In 2026, [**cbnsndwch LLC**](https://github.com/cbnsndwch) took over
maintenance of openCPQ because the upstream codebase had stopped receiving
updates while still being conceptually sound. This fork contributes:

- A full ground-up TypeScript rewrite targeting **React 19** and modern
  tooling (pnpm, Turbo, Vite, vitest, Changesets, oxlint).
- Removal of all 2015-era UI dependencies (`react-bootstrap`,
  `react-widgets`, `browser-filesaver`) in favour of native HTML + a thin
  CSS layer under `cpq-*` class names. Zero runtime dependencies.
- Modernised `Root` and `EmbeddedRoot` shells built as function components
  with `useReducer` for undo/redo history.
- A pnpm + Turbo monorepo with a handful of example apps covering
  cascading selects, multi-rollup pricing, validated multi-step forms, and
  live SVG previews via `CWrapVisualization`.
- CI, Changesets-based releases, and npm provenance publishing under
  `@cbnsndwch/opencpq`.

The class-based `Node` hierarchy and visitor dispatch were kept deliberately
— they are what make the library's reflection story work.

## License

openCPQ is MIT-licensed. The MIT License requires that the original
copyright notice be preserved in all copies and substantial portions of the
Software, so the `LICENSE` file in this repository and in the published
package carries both the upstream webXcerpt Software GmbH copyright and the
cbnsndwch LLC fork copyright. Please retain both if you redistribute.
