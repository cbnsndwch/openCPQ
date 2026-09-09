---
'@cbnsndwch/opencpq': patch
---

Externalize React and ReactDOM sub-path imports during Vite library build so `dist/index.js` stays pure ESM and does not call `require("react")` at runtime.
