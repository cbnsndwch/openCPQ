---
'@cbnsndwch/opencpq': minor
---

Export a headless `evaluate(type, value, aggregators, extraCtx?)` API that
evaluates a type tree without a React root while preserving linear aggregation
behavior for `t.multiplying` and `t.quantified`. Add docs and tests for SSR and
Worker-style usage.
