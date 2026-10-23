# Page Replacement Lab — FIFO · LRU · OPT

An interactive Operating Systems learning module for page replacement, redesigned
with a soft, minimal UI and seven dashboards in a top navigation bar.

## Dashboards

| Dashboard  | What it does |
|------------|--------------|
| Overview   | Landing page, quick results for a classic example, suggested learning path |
| Theory     | Concepts, hit & fault, FIFO, LRU, worked example, cheat sheet (sub-tabs) |
| Simulator  | Step / auto-play with animated frames, next-victim queue, live notebook table, step log, speed control, keyboard shortcuts |
| Compare    | FIFO vs LRU vs OPT side by side, hit/fault timeline, faults-vs-frames chart, automatic Belady's anomaly detection |
| Calculator | Full notebook solution, ratios with the working shown, per-step explanations, copy-as-text, Effective Access Time (EAT) calculator |
| Examples   | Curated strings (textbook 20-ref, Belady's anomaly, loops, locality ...) — one click to Simulate or Calculate |
| Practice   | Predict hit/fault and the victim page for each reference, with score, streak and explanations |

## UI / UX

- Soft minimal palette, light and dark themes (toggle in the top bar, remembered)
- Sliding nav indicator, staggered page entrance, button ripple + press feedback
- Frame pop-in, hit flash, animated counters, progress bar, toast messages
- Inline validation with shake feedback; responsive down to phones
- Respects `prefers-reduced-motion`

## Algorithms

- **FIFO** — evict the page that arrived earliest
- **LRU** — evict the least recently used page
- **OPT** — evict the page used farthest in the future (benchmark only)

Verified against textbook values: the 20-reference string with 3 frames gives
FIFO 15, LRU 12, OPT 9 faults; Belady's string gives FIFO 9 faults (3 frames) and 10 (4 frames).

## Files

- `module.js` — engine, dashboards and UI rendering
- `style.css` — scoped styling (everything lives under `.os-team13`)
- `demo.html` — standalone test page
- `README.md` — documentation

## Namespace and interface (unchanged)

```js
window.OSDashboard.modules["team13_page_fifo_lru"]
render(container)
reset()
getMetrics()   // { primaryMetricLabel: "Page Faults", primaryMetricValue, unit: "faults" }
```

## Run

Open `demo.html` in a browser. No build tool, no external dependencies.

## Limits

1–8 frames, up to 40 references, page numbers 0–99.
