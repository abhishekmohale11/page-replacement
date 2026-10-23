/* ==========================================================================
   Team 13 — Page Replacement Lab (FIFO · LRU · OPT)
   Namespace : window.OSDashboard.modules["team13_page_fifo_lru"]
   Interface : render(container) · reset() · getMetrics()
   ========================================================================== */
(() => {
    window.OSDashboard = window.OSDashboard || {};
    window.OSDashboard.modules = window.OSDashboard.modules || {};

    window.OSDashboard.modules["team13_page_fifo_lru"] = (() => {
        /* ------------------------------------------------------------------
           Constants & state
        ------------------------------------------------------------------ */
        const DEFAULT_REFERENCE = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3];
        const DEFAULT_FRAMES = 3;
        const DEFAULT_ALGORITHM = "FIFO";
        const MIN_FRAMES = 1;
        const MAX_FRAMES = 8;
        const MAX_REFS = 40;

        const ALGOS = {
            FIFO: { id: "FIFO", full: "First In First Out", rule: "Evict the page that arrived earliest", cls: "fifo" },
            LRU: { id: "LRU", full: "Least Recently Used", rule: "Evict the page unused for the longest time", cls: "lru" },
            OPT: { id: "OPT", full: "Optimal (Belady)", rule: "Evict the page whose next use is farthest in the future", cls: "opt" }
        };

        const EXAMPLES = [
            {
                id: "classic", title: "Classic starter",
                desc: "The 10-reference string used in the theory section. A gentle first example.",
                refs: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3], frames: 3
            },
            {
                id: "textbook", title: "Textbook 20-reference string",
                desc: "A well-known exam string. It clearly separates FIFO, LRU and the optimal algorithm.",
                refs: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], frames: 3
            },
            {
                id: "belady", title: "Belady's anomaly",
                desc: "With FIFO, giving this string 4 frames causes MORE faults than 3 frames. Try both.",
                refs: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], frames: 3
            },
            {
                id: "locality", title: "High locality",
                desc: "A few pages are reused again and again. Recency-aware LRU thrives here.",
                refs: [1, 2, 1, 3, 1, 2, 1, 4, 1, 2, 1, 3], frames: 3
            },
            {
                id: "loop", title: "Looping access",
                desc: "A loop slightly larger than memory — a worst case for both FIFO and LRU.",
                refs: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4], frames: 3
            },
            {
                id: "tiny", title: "Single frame",
                desc: "With one frame only repeated neighbours can hit. Useful to see the extreme case.",
                refs: [1, 1, 2, 2, 3, 1, 1, 3, 3, 2], frames: 1
            }
        ];

        const THEORY_TABS = [
            ["concepts", "Concepts"],
            ["hitfault", "Hit & Fault"],
            ["fifo", "FIFO"],
            ["lru", "LRU"],
            ["worked", "Worked Example"],
            ["cheat", "Cheat Sheet"]
        ];

        const ICONS = {
            home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
            book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
            cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
            compare: '<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
            calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
            layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
            target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
            sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
            moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
            play: '<path d="M7 4l13 8-13 8z"/>',
            pause: '<path d="M8 5v14M16 5v14"/>',
            prev: '<path d="M15 6l-6 6 6 6"/>',
            next: '<path d="M9 6l6 6-6 6"/>',
            end: '<path d="M6 6l6 6-6 6M18 6v12"/>',
            reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
            shuffle: '<path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c1.6 0 2.8-.9 3.8-2.2M14 8.5c.8-.9 1.8-1.5 3-1.5h4M18 4l3 3-3 3M18 14l3 3-3 3"/>',
            check: '<path d="M5 12l5 5 9-10"/>',
            x: '<path d="M6 6l12 12M18 6L6 18"/>',
            bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
            arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
            info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
        };

        let root = null;
        let shell = null;
        let host = null;

        let referenceString = [...DEFAULT_REFERENCE];
        let frameCount = DEFAULT_FRAMES;
        let algorithm = DEFAULT_ALGORITHM;
        let history = [];
        let currentStep = 0;
        let autoPlayTimer = null;
        let speedMs = 850;

        let activeTab = "overview";
        let theoryTab = "concepts";
        let theme = "light";
        let keyHandler = null;
        let resizeHandler = null;
        let practice = null;
        let practiceAlgo = "FIFO";
        let eat = { ma: 200, pf: 8, p: 0.1 };

        /* ------------------------------------------------------------------
           Helpers
        ------------------------------------------------------------------ */
        function escapeHTML(value) {
            return String(value)
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        function icon(name, size = 18) {
            return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
        }

        function parseReference(value) {
            const parts = String(value).trim().split(/[\s,;]+/).filter(Boolean);
            if (!parts.length) throw new Error("Enter at least one page number.");
            const nums = parts.map(Number);
            if (nums.some(n => !Number.isInteger(n) || n < 0)) {
                throw new Error("Use non-negative whole numbers only (e.g. 7, 0, 1, 2).");
            }
            if (nums.some(n => n > 99)) throw new Error("Page numbers must be 99 or smaller.");
            if (nums.length > MAX_REFS) throw new Error(`Please use at most ${MAX_REFS} references.`);
            return nums;
        }

        function pct(n, d, digits = 1) {
            return d ? ((n / d) * 100).toFixed(digits) : (0).toFixed(digits);
        }

        function stats(hist, upTo = hist.length) {
            const part = hist.slice(0, upTo);
            const faults = part.filter(s => !s.hit).length;
            const hits = part.length - faults;
            return { faults, hits, total: part.length, hitRatio: part.length ? hits / part.length : 0, faultRatio: part.length ? faults / part.length : 0 };
        }

        function randomRefs(len = 12, maxPage = 7) {
            const refs = [];
            for (let i = 0; i < len; i++) {
                // light locality: 35% chance to repeat a recent page
                if (refs.length > 2 && Math.random() < 0.35) {
                    refs.push(refs[refs.length - 1 - Math.floor(Math.random() * Math.min(3, refs.length))]);
                } else {
                    refs.push(Math.floor(Math.random() * (maxPage + 1)));
                }
            }
            return refs;
        }

        /* ------------------------------------------------------------------
           Simulation engine
        ------------------------------------------------------------------ */
        function simulate(algo, refs, frames) {
            const mem = [];
            const arrival = new Map();
            const lastUsed = new Map();
            const out = [];

            const meta = (p, idx) => {
                if (algo === "FIFO") return { key: arrival.get(p), label: `arrived step ${arrival.get(p) + 1}` };
                if (algo === "LRU") return { key: lastUsed.get(p), label: `last used step ${lastUsed.get(p) + 1}` };
                const n = refs.indexOf(p, idx + 1);
                return n < 0
                    ? { key: Infinity, label: "never used again" }
                    : { key: n, label: `next used step ${n + 1}` };
            };

            refs.forEach((page, index) => {
                const before = [...mem];
                const hit = mem.includes(page);
                let victim = null;
                let slot = mem.indexOf(page);
                let reason = "";
                let candidates = [];

                if (hit) {
                    lastUsed.set(page, index);
                    reason = `Page ${page} is already in Frame ${slot + 1}, so there is no fault and no replacement.` +
                        (algo === "LRU" ? " Its “last used” time is refreshed." : algo === "FIFO" ? " FIFO ignores the hit — arrival order does not change." : "");
                } else if (mem.length < frames) {
                    slot = mem.length;
                    mem.push(page);
                    reason = `Page ${page} is not in memory. Frame ${slot + 1} is empty, so it is loaded without evicting anything.`;
                } else {
                    candidates = mem.map(p => ({ page: p, ...meta(p, index) }));
                    let best = candidates[0];
                    candidates.forEach(c => {
                        if (algo === "OPT") {
                            if (c.key > best.key || (c.key === best.key && arrival.get(c.page) < arrival.get(best.page))) best = c;
                        } else if (c.key < best.key) best = c;
                    });
                    victim = best.page;
                    slot = mem.indexOf(victim);
                    mem[slot] = page;
                    const list = candidates.map(c => `${c.page} (${c.label})`).join(", ");
                    const why = algo === "FIFO" ? "the earliest arrival" : algo === "LRU" ? "the least recently used" : "the one needed farthest in the future";
                    reason = `Page ${page} is not in memory and all frames are full. Candidates: ${list}. Page ${victim} is ${why}, so it is replaced.`;
                }

                if (!hit) arrival.set(page, index);
                if (!hit) lastUsed.set(page, index);
                if (victim !== null) { arrival.delete(victim); lastUsed.delete(victim); }

                // eviction order of the state AFTER this step (first = next victim)
                const order = mem.map(p => ({ page: p, ...meta(p, index) })).sort((a, b) => {
                    if (algo === "OPT") return (b.key - a.key) || (arrival.get(a.page) - arrival.get(b.page)) || 0;
                    return a.key - b.key;
                });

                out.push({
                    index, page, before, after: [...mem], hit,
                    event: hit ? "HIT" : "FAULT",
                    victim, slot, reason, candidates, order,
                    full: !hit && before.length >= frames
                });
            });
            return out;
        }

        // Backwards-compatible names used by earlier versions
        const simulateFIFO = (r, f) => simulate("FIFO", r, f);
        const simulateLRU = (r, f) => simulate("LRU", r, f);

        function buildHistory() {
            history = simulate(algorithm, referenceString, frameCount);
            currentStep = 0;
        }

        function countFaults(untilStep = currentStep) { return stats(history, untilStep).faults; }
        function countHits(untilStep = currentStep) { return stats(history, untilStep).hits; }

        function stopAutoPlay() {
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }

        /* ------------------------------------------------------------------
           Shared UI pieces
        ------------------------------------------------------------------ */
        function toast(message, type = "info") {
            const box = shell && shell.querySelector("#toasts");
            if (!box) return;
            const el = document.createElement("div");
            el.className = `toast ${type}`;
            el.innerHTML = `${icon(type === "error" ? "x" : type === "success" ? "check" : "info", 16)}<span>${escapeHTML(message)}</span>`;
            box.appendChild(el);
            setTimeout(() => el.classList.add("out"), 2400);
            setTimeout(() => el.remove(), 2900);
        }

        function animateNumber(el, to, { decimals = 0, suffix = "" } = {}) {
            if (!el) return;
            const from = parseFloat(el.dataset.v ?? "0") || 0;
            el.dataset.v = to;
            if (from === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                el.textContent = to.toFixed(decimals) + suffix;
                return;
            }
            const start = performance.now();
            const dur = 380;
            const tick = now => {
                const t = Math.min(1, (now - start) / dur);
                const e = 1 - Math.pow(1 - t, 3);
                el.textContent = (from + (to - from) * e).toFixed(decimals) + suffix;
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }

        function segmented(id, options, active) {
            return `<div class="segmented" id="${id}" role="tablist">
                ${options.map(o => `<button type="button" class="seg-btn ${o === active ? "active" : ""}" data-value="${o}">${o}</button>`).join("")}
            </div>`;
        }

        function algoBadge(a) {
            return `<span class="algo-chip ${ALGOS[a].cls}">${a}</span>`;
        }

        function configBar({ algo = true, label = "Workspace" } = {}) {
            return `
            <section class="card config" data-reveal>
                <div class="field grow">
                    <label for="cfgRefs">Reference string</label>
                    <div class="input-row">
                        <input id="cfgRefs" class="input" type="text" autocomplete="off" spellcheck="false"
                            value="${referenceString.join(", ")}" placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4">
                        <button class="btn icon-btn" id="cfgShuffle" type="button" title="Generate a random string" aria-label="Random reference string">${icon("shuffle")}</button>
                    </div>
                </div>
                <div class="field">
                    <label>Frames</label>
                    <div class="stepper">
                        <button class="btn icon-btn" id="frameMinus" type="button" aria-label="Fewer frames">−</button>
                        <output id="frameOut">${frameCount}</output>
                        <button class="btn icon-btn" id="framePlus" type="button" aria-label="More frames">+</button>
                    </div>
                </div>
                ${algo ? `<div class="field"><label>Algorithm</label>${segmented("cfgAlgo", ["FIFO", "LRU", "OPT"], algorithm)}</div>` : ""}
                <div class="field"><label class="ghost-label">&nbsp;</label><button class="btn primary" id="cfgApply" type="button">${icon("bolt", 16)} Apply</button></div>
                <div class="field-error" id="cfgError" hidden></div>
            </section>`;
        }

        function bindConfigBar() {
            const input = host.querySelector("#cfgRefs");
            if (!input) return;
            host.querySelector("#cfgApply").addEventListener("click", () => applyConfig());
            input.addEventListener("keydown", e => { if (e.key === "Enter") applyConfig(); });
            host.querySelector("#frameMinus").addEventListener("click", () => applyConfig({ frames: frameCount - 1 }));
            host.querySelector("#framePlus").addEventListener("click", () => applyConfig({ frames: frameCount + 1 }));
            host.querySelector("#cfgShuffle").addEventListener("click", () => {
                const refs = randomRefs(12, Math.max(4, frameCount + 3));
                input.value = refs.join(", ");
                applyConfig();
                toast("Random reference string generated", "success");
            });
            const algo = host.querySelector("#cfgAlgo");
            if (algo) {
                algo.querySelectorAll(".seg-btn").forEach(btn => {
                    btn.addEventListener("click", () => applyConfig({ algorithm: btn.dataset.value }));
                });
            }
        }

        function showCfgError(message) {
            const box = host.querySelector("#cfgError");
            const input = host.querySelector("#cfgRefs");
            if (!box) return;
            if (!message) { box.hidden = true; box.textContent = ""; input && input.classList.remove("invalid"); return; }
            box.hidden = false;
            box.textContent = message;
            if (input) {
                input.classList.remove("invalid");
                void input.offsetWidth;
                input.classList.add("invalid");
            }
        }

        function applyConfig(over = {}) {
            try {
                const input = host.querySelector("#cfgRefs");
                const refs = parseReference(input ? input.value : referenceString.join(","));
                const frames = over.frames ?? frameCount;
                if (!Number.isInteger(frames) || frames < MIN_FRAMES || frames > MAX_FRAMES) {
                    throw new Error(`Number of frames must be between ${MIN_FRAMES} and ${MAX_FRAMES}.`);
                }
                referenceString = refs;
                frameCount = frames;
                if (over.algorithm) algorithm = over.algorithm;
                stopAutoPlay();
                buildHistory();
                practice = null;
                showTab(activeTab, { soft: true });
            } catch (err) {
                showCfgError(err.message);
                toast(err.message, "error");
            }
        }

        function loadExample(ex, target) {
            referenceString = [...ex.refs];
            frameCount = ex.frames;
            stopAutoPlay();
            buildHistory();
            practice = null;
            showTab(target);
            toast(`Loaded “${ex.title}”`, "success");
        }

        /* Notebook (the table you draw in an exam) */
        function notebook(hist, frames, upTo = hist.length) {
            let h = `<div class="nb-scroll"><table class="nb"><thead><tr><th class="nb-corner">Page</th>`;
            hist.forEach((s, i) => {
                const cls = i < upTo ? (s.hit ? "is-hit" : "is-fault") : "pending";
                h += `<th class="${cls} ${i === upTo - 1 ? "cur" : ""}">${s.page}</th>`;
            });
            h += `</tr></thead><tbody>`;
            for (let r = 0; r < frames; r++) {
                h += `<tr><th>Frame ${r + 1}</th>`;
                hist.forEach((s, i) => {
                    if (i >= upTo) { h += `<td class="pending"></td>`; return; }
                    const v = s.after[r];
                    const changed = !s.hit && v !== s.before[r];
                    const tip = changed && s.before[r] !== undefined ? ` title="Replaced page ${s.before[r]}"` : "";
                    h += `<td class="${changed ? "loaded" : ""} ${i === upTo - 1 ? "cur" : ""}"${tip}>${v === undefined ? "–" : v}</td>`;
                });
                h += `</tr>`;
            }
            h += `<tr class="nb-result"><th>Result</th>`;
            hist.forEach((s, i) => {
                h += i < upTo
                    ? `<td class="${i === upTo - 1 ? "cur" : ""}"><span class="hf ${s.hit ? "h" : "f"}">${s.hit ? "H" : "F"}</span></td>`
                    : `<td class="pending"></td>`;
            });
            h += `</tr></tbody></table></div>`;
            return h;
        }

        function metricCard(label, id, hint, tone) {
            return `<div class="metric ${tone || ""}"><span>${label}</span><strong id="${id}">0</strong><small>${hint}</small></div>`;
        }

        /* ------------------------------------------------------------------
           Shell, navigation, transitions
        ------------------------------------------------------------------ */
        const TABS = [
            { id: "overview", label: "Overview", icon: "home" },
            { id: "theory", label: "Theory", icon: "book" },
            { id: "simulator", label: "Simulator", icon: "cpu" },
            { id: "compare", label: "Compare", icon: "compare" },
            { id: "calculator", label: "Calculator", icon: "calc" },
            { id: "examples", label: "Examples", icon: "layers" },
            { id: "practice", label: "Practice", icon: "target" }
        ];

        function render(container) {
            stopAutoPlay();
            detachGlobalHandlers();
            root = container;
            try { theme = localStorage.getItem("team13-theme") || theme; } catch (e) { /* ignore */ }

            root.innerHTML = `
            <section class="os-team13" data-theme="${theme}">
                <header class="topbar">
                    <div class="topbar-inner">
                        <div class="brand">
                            <span class="brand-mark"><i></i><i></i><i></i></span>
                            <div class="brand-text"><b>Page Replacement Lab</b><small>FIFO · LRU · OPT</small></div>
                        </div>
                        <nav class="nav" id="nav" aria-label="Dashboards">
                            ${TABS.map(t => `<button type="button" class="nav-btn" data-tab="${t.id}">${icon(t.icon, 16)}<span>${t.label}</span></button>`).join("")}
                            <span class="nav-indicator" id="navIndicator"></span>
                        </nav>
                        <button type="button" class="btn icon-btn theme-btn" id="themeBtn" aria-label="Toggle theme" title="Toggle light / dark">${icon(theme === "dark" ? "sun" : "moon")}</button>
                    </div>
                </header>
                <main class="page-host" id="pageHost"></main>
                <footer class="foot">Team 13 · Operating Systems · Page Replacement Lab</footer>
                <div class="toasts" id="toasts" aria-live="polite"></div>
            </section>`;

            shell = root.querySelector(".os-team13");
            host = root.querySelector("#pageHost");

            shell.querySelectorAll(".nav-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (btn.dataset.tab !== activeTab) { stopAutoPlay(); showTab(btn.dataset.tab); }
                });
            });
            shell.querySelector("#themeBtn").addEventListener("click", toggleTheme);

            shell.addEventListener("click", e => {
                const b = e.target.closest(".btn");
                if (!b || b.disabled) return;
                const rect = b.getBoundingClientRect();
                const r = document.createElement("span");
                r.className = "ripple";
                const size = Math.max(rect.width, rect.height);
                r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
                b.appendChild(r);
                setTimeout(() => r.remove(), 600);
            });

            resizeHandler = () => updateIndicator();
            window.addEventListener("resize", resizeHandler);

            buildHistory();
            showTab(activeTab, { first: true });
        }

        function detachGlobalHandlers() {
            if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
            if (resizeHandler) { window.removeEventListener("resize", resizeHandler); resizeHandler = null; }
        }

        function toggleTheme() {
            theme = theme === "dark" ? "light" : "dark";
            shell.dataset.theme = theme;
            shell.querySelector("#themeBtn").innerHTML = icon(theme === "dark" ? "sun" : "moon");
            try { localStorage.setItem("team13-theme", theme); } catch (e) { /* ignore */ }
        }

        function updateIndicator() {
            if (!shell) return;
            const nav = shell.querySelector("#nav");
            const active = nav.querySelector(".nav-btn.active");
            const ind = shell.querySelector("#navIndicator");
            if (!active || !ind) return;
            ind.style.width = `${active.offsetWidth}px`;
            ind.style.transform = `translateX(${active.offsetLeft}px)`;
            if (nav.scrollWidth > nav.clientWidth) {
                nav.scrollTo({ left: active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
            }
        }

        function showTab(id, opts = {}) {
            activeTab = id;
            if (keyHandler) { document.removeEventListener("keydown", keyHandler); keyHandler = null; }
            shell.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
            updateIndicator();

            const pages = {
                overview: [overviewPage, bindOverview],
                theory: [theoryPage, bindTheory],
                simulator: [simulatorPage, bindSimulator],
                compare: [comparePage, bindCompare],
                calculator: [calculatorPage, bindCalculator],
                examples: [examplesPage, bindExamples],
                practice: [practicePage, bindPractice]
            };
            const [view, bind] = pages[id];
            host.innerHTML = `<div class="page ${opts.soft ? "soft" : ""}" data-page="${id}">${view()}</div>`;
            host.querySelectorAll("[data-reveal]").forEach((el, i) => el.style.setProperty("--i", Math.min(i, 9)));
            bind();
            if (!opts.first && !opts.soft) window.scrollTo && root.getBoundingClientRect().top < 0 && shell.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        /* ------------------------------------------------------------------
           Dashboard 1 — Overview
        ------------------------------------------------------------------ */
        function overviewPage() {
            const ex = EXAMPLES[1];
            const res = ["FIFO", "LRU", "OPT"].map(a => ({ a, s: stats(simulate(a, ex.refs, ex.frames)) }));
            const maxF = Math.max(...res.map(r => r.s.faults));
            const cards = [
                ["theory", "book", "Theory", "Clear definitions, step-by-step handling and notebook tricks."],
                ["simulator", "cpu", "Simulator", "Step through every reference with live frames and eviction queue."],
                ["compare", "compare", "Compare", "FIFO vs LRU vs OPT side by side, plus a frames-vs-faults chart."],
                ["calculator", "calc", "Calculator", "Full solution, ratios with working, and effective access time."],
                ["examples", "layers", "Examples", "Curated strings including Belady's anomaly. One click to load."],
                ["practice", "target", "Practice", "Predict hits, faults and victims. Get instant feedback."]
            ];
            return `
            <section class="hero" data-reveal>
                <div class="hero-copy">
                    <span class="kicker">OPERATING SYSTEMS · MEMORY MANAGEMENT</span>
                    <h1>Learn page replacement by watching it happen.</h1>
                    <p>An interactive lab for FIFO and LRU page replacement — with the optimal algorithm as a benchmark. Read the theory, run the simulator, then test yourself.</p>
                    <div class="hero-actions">
                        <button class="btn primary lg" data-go="simulator">${icon("play", 16)} Start simulating</button>
                        <button class="btn lg" data-go="theory">${icon("book", 16)} Read theory first</button>
                    </div>
                </div>
                <div class="hero-visual" aria-hidden="true">
                    <div class="hv-stream">${DEFAULT_REFERENCE.map((p, i) => `<span style="--d:${i * 70}ms">${p}</span>`).join("")}</div>
                    <div class="hv-frames"><div><small>Frame 1</small><b>2</b></div><div><small>Frame 2</small><b>0</b></div><div class="hv-new"><small>Frame 3</small><b>3</b></div></div>
                    <div class="hv-status"><i></i>Page fault · victim evicted</div>
                </div>
            </section>

            <section class="grid-3" data-reveal>
                ${cards.map(c => `
                <button class="feature" data-go="${c[0]}">
                    <span class="feature-ico">${icon(c[1], 20)}</span>
                    <b>${c[2]}</b>
                    <p>${c[3]}</p>
                    <span class="feature-arrow">${icon("arrow", 16)}</span>
                </button>`).join("")}
            </section>

            <section class="grid-2 even" data-reveal>
                <div class="card">
                    <div class="card-head"><div><span class="kicker">AT A GLANCE</span><h2>${ex.title}</h2></div><span class="pill">${ex.frames} frames</span></div>
                    <p class="muted">Faults for the ${ex.refs.length}-reference string — fewer is better.</p>
                    <div class="bars">
                        ${res.map(r => `
                        <div class="bar-row">
                            <span class="bar-label">${algoBadge(r.a)}</span>
                            <div class="bar-track"><div class="bar-fill ${ALGOS[r.a].cls}" style="--w:${maxF ? (r.s.faults / maxF) * 100 : 0}%"></div></div>
                            <b class="bar-val">${r.s.faults}</b>
                        </div>`).join("")}
                    </div>
                    <button class="btn ghost" data-example="textbook">Open this example ${icon("arrow", 14)}</button>
                </div>
                <div class="card">
                    <div class="card-head"><div><span class="kicker">LEARNING PATH</span><h2>Suggested order</h2></div></div>
                    <ol class="path">
                        <li><b>Understand</b><span>Page hits, faults and the replacement lifecycle.</span></li>
                        <li><b>Solve on paper</b><span>Use the notebook method from the Theory page.</span></li>
                        <li><b>Watch &amp; verify</b><span>Step through the Simulator and check each victim.</span></li>
                        <li><b>Compare</b><span>See why LRU usually beats FIFO — and when it doesn't.</span></li>
                        <li><b>Test yourself</b><span>Predict outcomes in Practice mode.</span></li>
                    </ol>
                </div>
            </section>`;
        }

        function bindOverview() {
            host.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));
            host.querySelectorAll("[data-example]").forEach(b => b.addEventListener("click", () => {
                loadExample(EXAMPLES.find(e => e.id === b.dataset.example), "calculator");
            }));
        }

        /* ------------------------------------------------------------------
           Dashboard 2 — Theory
        ------------------------------------------------------------------ */
        function theoryPage() {
            return `
            <section class="subnav" data-reveal>
                ${THEORY_TABS.map(([id, label]) => `<button type="button" class="chip ${id === theoryTab ? "active" : ""}" data-theory="${id}">${label}</button>`).join("")}
            </section>
            <div id="theoryBody" class="theory-body">${theoryContent(theoryTab)}</div>`;
        }

        function bindTheory() {
            host.querySelectorAll("[data-theory]").forEach(btn => {
                btn.addEventListener("click", () => {
                    theoryTab = btn.dataset.theory;
                    host.querySelectorAll("[data-theory]").forEach(b => b.classList.toggle("active", b === btn));
                    const body = host.querySelector("#theoryBody");
                    body.innerHTML = theoryContent(theoryTab);
                    body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap");
                    body.querySelectorAll("[data-reveal]").forEach((el, i) => el.style.setProperty("--i", Math.min(i, 9)));
                    bindTheoryInner();
                });
            });
            bindTheoryInner();
            const body = host.querySelector("#theoryBody");
            body.classList.add("swap");
        }

        function bindTheoryInner() {
            host.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); showTab(b.dataset.go); }));
            host.querySelectorAll(".acc-head").forEach(h => h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
        }

        function steps(items) {
            return `<ol class="steps">${items.map(i => `<li>${i}</li>`).join("")}</ol>`;
        }

        function theoryContent(tab) {
            const reveal = 'data-reveal';
            if (tab === "concepts") {
                return `
                <article class="card prose" ${reveal}>
                    <div class="card-head"><div><span class="kicker">01 · FOUNDATIONS</span><h2>What is page replacement?</h2></div></div>
                    <p><b>Page replacement</b> is a core memory-management mechanism in operating systems that support <b>virtual memory</b> and <b>demand paging</b>. Virtual memory lets a process use more address space than there is physical RAM by loading pages into frames only when the CPU asks for them.</p>
                    <p>When the CPU requests a page that is not in memory, a <b>page fault</b> occurs. If a free frame exists, the OS simply loads the page. When <b>all frames are occupied</b>, the OS runs a replacement algorithm (such as FIFO or LRU) to choose a <b>victim page</b>, evicts it, and uses the freed frame for the new page.</p>
                </article>

                <article class="card" ${reveal}>
                    <div class="card-head"><div><span class="kicker">LIFECYCLE</span><h2>Step-by-step handling</h2></div></div>
                    <div class="timeline">
                        ${[
                        ["Page fault trigger", "The CPU accesses a page whose page-table entry is marked invalid (0)."],
                        ["Frame allocation check", "The OS looks for a free physical frame."],
                        ["Victim selection", "No free frame? The replacement algorithm picks a resident page to evict."],
                        ["Write-back (dirty check)", "If the victim's dirty bit is 1 it is written to disk; clean pages are simply discarded."],
                        ["Swap in", "The requested page is read from disk into the freed frame."],
                        ["Update & restart", "Victim entry → invalid (0); new entry → valid (1) with its frame number; the instruction restarts."]
                    ].map((s, i) => `<div class="tl-item"><span class="tl-dot">${i + 1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></div>`).join("")}
                    </div>
                </article>

                <section class="grid-3" ${reveal}>
                    <div class="term t-blue"><b>Victim page</b><p>The resident page chosen to be evicted — by arrival order in FIFO, by recency in LRU.</p></div>
                    <div class="term t-teal"><b>Dirty / modify bit</b><p>Set by hardware on writes. Clean pages need no disk write on eviction, halving service time.</p></div>
                    <div class="term t-amber"><b>Thrashing</b><p>If replacements happen too often, the system spends its time paging instead of computing.</p></div>
                </section>

                <article class="callout" ${reveal}>
                    ${icon("info", 20)}
                    <div><b>Real-life analogy.</b> Your desk fits <b>3 open books</b> (frames) but you need <b>10 books</b> from the library (pages). To open a 4th you must close one and return it to the shelf. A good strategy closes the book you won't need soon.</div>
                </article>`;
            }

            if (tab === "hitfault") {
                return `
                <section class="grid-2 even" ${reveal}>
                    <article class="card tone-hit">
                        <div class="card-head"><div><span class="kicker good">PAGE HIT</span><h2>Page is in RAM</h2></div><span class="hf h big">H</span></div>
                        <p>A <b>page hit</b> happens when the referenced page is already loaded in a frame. The MMU maps the address directly — <b>no disk transfer</b>, no OS intervention.</p>
                        ${steps([
                    "CPU generates a virtual address (page number + offset).",
                    "MMU looks up the page table (or TLB).",
                    "The valid–invalid bit is <b>Valid (1)</b>.",
                    "The frame number is read with no trap.",
                    "Data is accessed at memory speed (~50–100 ns)."
                ])}
                        <div class="formula"><span>Hit ratio</span><code>Hits ÷ Total references × 100%</code></div>
                    </article>
                    <article class="card tone-fault">
                        <div class="card-head"><div><span class="kicker bad">PAGE FAULT</span><h2>Page is not in RAM</h2></div><span class="hf f big">F</span></div>
                        <p>A <b>page fault</b> happens when the page is <b>absent</b> from RAM. The MMU finds an invalid entry and traps to the OS, which must fetch the page from disk.</p>
                        ${steps([
                    "MMU detects the entry is <b>Invalid (0)</b>.",
                    "A trap raises a page-fault interrupt.",
                    "The OS verifies the access and locates the page on disk.",
                    "It finds a free frame — or runs the replacement algorithm.",
                    "Disk I/O loads the page.",
                    "The page table entry becomes <b>Valid (1)</b>.",
                    "The instruction restarts."
                ])}
                        <div class="formula"><span>Fault ratio</span><code>Faults ÷ Total references × 100%</code></div>
                    </article>
                </section>
                <article class="callout warn" ${reveal}>${icon("bolt", 20)}<div><b>Why it matters.</b> A disk access takes roughly 5–10 ms — about <b>100,000× slower</b> than RAM. Reducing faults is the whole point of a replacement algorithm. Try the <a href="#" data-go="calculator">effective access time calculator</a>.</div></article>`;
            }

            if (tab === "fifo") {
                const sim = simulate("FIFO", [7, 0, 1, 2, 0], 3);
                return `
                <section class="grid-2" ${reveal}>
                    <article class="card">
                        <div class="card-head"><div><span class="kicker fifo-c">FIFO</span><h2>First In First Out</h2></div>${algoBadge("FIFO")}</div>
                        <p>FIFO removes the page that has been in memory the <b>longest</b>. It behaves like a queue: the first page in is the first page out.</p>
                        <div class="rule">“Oldest arrival leaves first.”</div>
                        <h3>How to solve it in your notebook</h3>
                        ${steps([
                    "Draw one row per frame.",
                    "Read the reference string left to right.",
                    "Page already in a frame? Write <b>H</b>; frames stay unchanged.",
                    "Otherwise write <b>F</b>.",
                    "Empty frame available? Put the page there.",
                    "All frames full? Replace the page that entered earliest.",
                    "Move the FIFO pointer to the next frame.",
                    "Count the F marks — that is your total page faults."
                ])}
                    </article>
                    <div class="stack">
                        <article class="card">
                            <div class="card-head"><div><span class="kicker">NOTEBOOK FORMAT</span><h2>First five references</h2></div></div>
                            ${notebook(sim, 3)}
                            <p class="muted small">Replacement order depends on arrival time — not on how recently a page was used.</p>
                        </article>
                        <article class="callout warn">${icon("bolt", 20)}<div><b>Belady's anomaly.</b> FIFO can produce <i>more</i> faults when you give it <i>more</i> frames. Try the <a href="#" data-go="examples">Belady example</a>.</div></article>
                    </div>
                </section>`;
            }

            if (tab === "lru") {
                return `
                <section class="grid-2" ${reveal}>
                    <article class="card">
                        <div class="card-head"><div><span class="kicker lru-c">LRU</span><h2>Least Recently Used</h2></div>${algoBadge("LRU")}</div>
                        <p>LRU replaces the page whose most recent use is <b>farthest in the past</b>. When a fault occurs with full memory, look backward through the reference string.</p>
                        <div class="rule">“The page not used for the longest time leaves.”</div>
                        <h3>How to solve it in your notebook</h3>
                        ${steps([
                    "Draw one row per frame.",
                    "Read the reference string left to right.",
                    "Hit? Write <b>H</b>, keep the frames unchanged.",
                    "Absent? Write <b>F</b>.",
                    "Empty frame available? Put the page there.",
                    "Frames full? Look <b>backward</b> in the string.",
                    "Find which resident page was used least recently.",
                    "Replace it, then count all F marks."
                ])}
                    </article>
                    <div class="stack">
                        <article class="card">
                            <div class="card-head"><div><span class="kicker">BACKWARD-CHECK TRICK</span><h2>Look back, find the oldest</h2></div></div>
                            <div class="trick">
                                <span>Current fault</span><i>${icon("arrow", 14)}</i>
                                <span>Look backward</span><i>${icon("arrow", 14)}</i>
                                <span>First sighting of each resident page</span><i>${icon("arrow", 14)}</i>
                                <span class="strong">Farthest back = victim</span>
                            </div>
                            <p class="muted small">Example: frames hold 2, 0, 3. Looking backward, 3 was used most recently, then 0, and 2 is farthest back — so <b>2</b> is the LRU victim.</p>
                        </article>
                        <article class="callout">${icon("info", 20)}<div><b>Stack property.</b> LRU never suffers Belady's anomaly: more frames can never mean more faults.</div></article>
                    </div>
                </section>`;
            }

            if (tab === "worked") {
                const refs = DEFAULT_REFERENCE;
                const fifo = simulate("FIFO", refs, 3);
                const lru = simulate("LRU", refs, 3);
                const sf = stats(fifo), sl = stats(lru);
                return `
                <article class="card" ${reveal}>
                    <div class="card-head"><div><span class="kicker">WORKED EXAMPLE</span><h2>Reference string: ${refs.join(", ")}</h2></div><span class="pill">3 frames</span></div>
                    <p class="muted">Work left to right. Highlighted cells show where a new page was loaded.</p>
                    <h3>${algoBadge("FIFO")} <span class="inline-result">${sf.faults} faults · ${sf.hits} hits</span></h3>
                    ${notebook(fifo, 3)}
                    <h3 class="mt">${algoBadge("LRU")} <span class="inline-result">${sl.faults} faults · ${sl.hits} hits</span></h3>
                    ${notebook(lru, 3)}
                    <div class="grid-2 even mt">
                        <div class="note"><b>For FIFO</b> keep an arrival queue. On every fault with full memory, replace the oldest resident page.</div>
                        <div class="note"><b>For LRU</b> on every fault with full memory, inspect earlier references and replace the page used least recently.</div>
                    </div>
                    <div class="row-actions"><button class="btn primary" data-go="simulator">${icon("play", 16)} Watch it in the simulator</button></div>
                </article>`;
            }

            return `
            <article class="card" ${reveal}>
                <div class="card-head"><div><span class="kicker">QUICK REVISION</span><h2>FIFO vs LRU vs OPT</h2></div></div>
                <div class="table-scroll"><table class="data">
                    <thead><tr><th>Point</th><th>${algoBadge("FIFO")}</th><th>${algoBadge("LRU")}</th><th>${algoBadge("OPT")}</th></tr></thead>
                    <tbody>
                        <tr><td>Full form</td><td>First In First Out</td><td>Least Recently Used</td><td>Optimal</td></tr>
                        <tr><td>Victim</td><td>Oldest arrival</td><td>Least recently used</td><td>Used farthest in future</td></tr>
                        <tr><td>Tracks</td><td>Arrival order / queue</td><td>Recent usage</td><td>Future references</td></tr>
                        <tr><td>On a hit</td><td>Nothing changes</td><td>Refresh recency</td><td>Nothing changes</td></tr>
                        <tr><td>Belady's anomaly</td><td>Possible</td><td>Never</td><td>Never</td></tr>
                        <tr><td>Practical?</td><td>Yes, very simple</td><td>Yes (hardware help)</td><td>No — needs the future</td></tr>
                        <tr><td>Memory trick</td><td>“First in → first out”</td><td>“Not used lately → out”</td><td>“Needed last → out”</td></tr>
                    </tbody>
                </table></div>
            </article>
            <section class="grid-2 even" ${reveal}>
                <article class="card"><div class="card-head"><div><span class="kicker">FORMULAS</span><h2>Remember these</h2></div></div>
                    <div class="formula"><span>Hit ratio</span><code>Hits ÷ References</code></div>
                    <div class="formula"><span>Fault ratio</span><code>Faults ÷ References</code></div>
                    <div class="formula"><span>Hits</span><code>References − Faults</code></div>
                    <div class="formula"><span>EAT</span><code>(1 − p) × ma + p × fault time</code></div>
                </article>
                <article class="card"><div class="card-head"><div><span class="kicker">EXAM CHECKLIST</span><h2>Before you submit</h2></div></div>
                    <ul class="check">
                        <li>One column per reference, one row per frame.</li>
                        <li>Hits never change the frames (except LRU recency).</li>
                        <li>Count faults, not frames changed.</li>
                        <li>Recount: Faults + Hits = References.</li>
                    </ul>
                </article>
            </section>`;
        }

        /* ------------------------------------------------------------------
           Dashboard 3 — Simulator
        ------------------------------------------------------------------ */
        function simulatorPage() {
            return `
            ${configBar({ algo: true })}

            <section class="card" data-reveal>
                <div class="card-head">
                    <div><span class="kicker">REFERENCE STREAM</span><h2>Page-by-page execution</h2></div>
                    <span class="pill" id="stepPill">Step 0 / ${referenceString.length}</span>
                </div>
                <div class="stream" id="stream"></div>
            </section>

            <div class="grid-2 sim">
                <section class="card" data-reveal>
                    <div class="card-head">
                        <div><span class="kicker">MAIN MEMORY</span><h2>Memory frames</h2></div>
                        <span class="algo-chip ${ALGOS[algorithm].cls}" id="algorithmTag">${algorithm}</span>
                    </div>
                    <div id="memoryFrames" class="frames"></div>
                    <div id="evictNote" class="evict-note" hidden></div>
                    <div id="statusMessage" class="status neutral"></div>
                    <div class="progress"><div class="progress-labels"><span>Progress</span><span id="progressText">0%</span></div><div class="progress-track"><div id="progressBar"></div></div></div>
                    <div class="controls">
                        <button id="prevBtn" class="btn" type="button">${icon("prev", 16)} Previous</button>
                        <button id="playBtn" class="btn accent" type="button">${icon("play", 16)} Auto play</button>
                        <button id="nextBtn" class="btn primary" type="button">Next ${icon("next", 16)}</button>
                        <button id="endBtn" class="btn icon-btn" type="button" title="Jump to end" aria-label="Jump to end">${icon("end", 16)}</button>
                        <button id="resetBtn" class="btn icon-btn" type="button" title="Reset everything" aria-label="Reset">${icon("reset", 16)}</button>
                    </div>
                    <div class="controls-meta">
                        <label class="speed">Speed
                            <select id="speedSelect" class="select">
                                <option value="1400" ${speedMs === 1400 ? "selected" : ""}>Slow</option>
                                <option value="850" ${speedMs === 850 ? "selected" : ""}>Normal</option>
                                <option value="400" ${speedMs === 400 ? "selected" : ""}>Fast</option>
                            </select>
                        </label>
                        <span class="hint"><kbd>←</kbd> <kbd>→</kbd> step · <kbd>Space</kbd> play</span>
                    </div>
                </section>

                <div class="stack">
                    <div class="metrics" data-reveal>
                        ${metricCard("Page faults", "faultMetric", "Not found in memory", "bad")}
                        ${metricCard("Page hits", "hitMetric", "Already in memory", "good")}
                        ${metricCard("Hit ratio", "hitRatioMetric", "Hits ÷ processed", "")}
                        ${metricCard("Fault ratio", "faultRatioMetric", "Faults ÷ processed", "")}
                    </div>
                    <section class="card" data-reveal>
                        <div class="card-head"><div><span class="kicker">EVICTION ORDER</span><h2>Next victim</h2></div></div>
                        <div id="queue" class="queue"></div>
                        <p class="muted small" id="queueHint"></p>
                    </section>
                </div>
            </div>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">LIVE NOTEBOOK</span><h2>Your exam table, filled as you go</h2></div></div>
                <div id="liveNotebook"></div>
            </section>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">EXECUTION LOG</span><h2>Step history</h2></div></div>
                <div class="table-scroll log-scroll" id="logScroll"><table class="data">
                    <thead><tr><th>Step</th><th>Page</th><th>Result</th><th>Frames after</th><th>Evicted</th></tr></thead>
                    <tbody id="historyBody"></tbody>
                </table></div>
            </section>

            <div id="completionCard" class="completion" hidden></div>`;
        }

        function bindSimulator() {
            bindConfigBar();
            host.querySelector("#nextBtn").addEventListener("click", () => { stopAutoPlay(); setPlayLabel(); nextStep(); });
            host.querySelector("#prevBtn").addEventListener("click", () => { stopAutoPlay(); setPlayLabel(); previousStep(); });
            host.querySelector("#playBtn").addEventListener("click", toggleAutoPlay);
            host.querySelector("#resetBtn").addEventListener("click", () => { reset(); toast("Simulator reset to defaults", "success"); });
            host.querySelector("#endBtn").addEventListener("click", () => { stopAutoPlay(); setPlayLabel(); currentStep = history.length; renderSim(); });
            host.querySelector("#speedSelect").addEventListener("change", e => {
                speedMs = Number(e.target.value);
                if (autoPlayTimer) { stopAutoPlay(); startAutoPlay(); }
            });

            keyHandler = e => {
                if (activeTab !== "simulator") return;
                if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
                if (e.key === "ArrowRight") { e.preventDefault(); stopAutoPlay(); setPlayLabel(); nextStep(); }
                else if (e.key === "ArrowLeft") { e.preventDefault(); stopAutoPlay(); setPlayLabel(); previousStep(); }
                else if (e.key === " ") { e.preventDefault(); toggleAutoPlay(); }
            };
            document.addEventListener("keydown", keyHandler);
            renderSim();
        }

        function setPlayLabel() {
            const b = host.querySelector("#playBtn");
            if (!b) return;
            b.innerHTML = autoPlayTimer ? `${icon("pause", 16)} Pause` : `${icon("play", 16)} Auto play`;
        }

        function nextStep() {
            if (currentStep < history.length) { currentStep++; renderSim(); }
        }

        function previousStep() {
            if (currentStep > 0) { currentStep--; renderSim(); }
        }

        function startAutoPlay() {
            if (currentStep >= history.length) { currentStep = 0; renderSim(); }
            autoPlayTimer = setInterval(() => {
                if (currentStep >= history.length) { stopAutoPlay(); setPlayLabel(); return; }
                currentStep++;
                renderSim();
                if (currentStep >= history.length) { stopAutoPlay(); setPlayLabel(); }
            }, speedMs);
        }

        function toggleAutoPlay() {
            if (autoPlayTimer) { stopAutoPlay(); setPlayLabel(); return; }
            startAutoPlay();
            setPlayLabel();
        }

        function reset() {
            stopAutoPlay();
            referenceString = [...DEFAULT_REFERENCE];
            frameCount = DEFAULT_FRAMES;
            algorithm = DEFAULT_ALGORITHM;
            practice = null;
            buildHistory();
            if (host) showTab(activeTab, { soft: true });
        }

        function renderSim() {
            if (activeTab !== "simulator" || !host.querySelector("#stream")) return;
            renderStream();
            renderMetrics();
            renderFrames();
            renderStatus();
            renderQueue();
            renderLiveNotebook();
            renderHistory();
            renderCompletion();
        }

        function renderStream() {
            const box = host.querySelector("#stream");
            box.innerHTML = referenceString.map((page, i) => {
                let state = "";
                if (i < currentStep) state = history[i].hit ? "was-hit" : "was-fault";
                if (i === currentStep - 1) state += " current";
                if (i === currentStep) state += " upcoming";
                return `<div class="chip-ref ${state}" title="Reference ${i + 1}: page ${page}">
                    <span class="ref-index">${i + 1}</span><b>${page}</b>
                </div>`;
            }).join("");
            const cur = box.querySelector(".current") || box.querySelector(".upcoming");
            if (cur) box.scrollTo({ left: cur.offsetLeft - box.clientWidth / 2 + cur.offsetWidth / 2, behavior: "smooth" });
            host.querySelector("#stepPill").textContent = `Step ${currentStep} / ${referenceString.length}`;
        }

        function renderMetrics() {
            const s = stats(history, currentStep);
            animateNumber(host.querySelector("#faultMetric"), s.faults);
            animateNumber(host.querySelector("#hitMetric"), s.hits);
            animateNumber(host.querySelector("#hitRatioMetric"), s.hitRatio * 100, { decimals: 1, suffix: "%" });
            animateNumber(host.querySelector("#faultRatioMetric"), s.faultRatio * 100, { decimals: 1, suffix: "%" });
        }

        function renderFrames() {
            const box = host.querySelector("#memoryFrames");
            const cur = currentStep ? history[currentStep - 1] : null;
            const frames = cur ? cur.after : [];
            const nextOut = cur && cur.after.length >= frameCount ? cur.order[0].page : null;

            box.innerHTML = Array.from({ length: frameCount }, (_, i) => {
                const v = frames[i];
                const loaded = cur && !cur.hit && cur.slot === i;
                const hitHere = cur && cur.hit && cur.slot === i;
                const cls = [v === undefined ? "empty" : "filled", loaded ? "updated" : "", hitHere ? "hit-flash" : ""].join(" ");
                return `<div class="frame ${cls}" style="--i:${i}">
                    <span class="frame-label">Frame ${i + 1}</span>
                    <div class="frame-value">${v === undefined ? "—" : v}</div>
                    ${v !== undefined && v === nextOut ? `<span class="frame-tag">next out</span>` : ""}
                </div>`;
            }).join("");

            host.querySelector("#algorithmTag").textContent = algorithm;
            host.querySelector("#algorithmTag").className = `algo-chip ${ALGOS[algorithm].cls}`;

            const note = host.querySelector("#evictNote");
            if (cur && cur.victim !== null) {
                note.hidden = false;
                note.className = "evict-note show";
                note.innerHTML = `<span class="out-page">${cur.victim}</span> ${icon("arrow", 14)} evicted from Frame ${cur.slot + 1}, replaced by <b>${cur.page}</b>`;
            } else {
                note.hidden = true;
            }
        }

        function renderStatus() {
            const box = host.querySelector("#statusMessage");
            const progress = history.length ? Math.round((currentStep / history.length) * 100) : 0;
            host.querySelector("#progressBar").style.width = `${progress}%`;
            host.querySelector("#progressText").textContent = `${progress}%`;

            if (currentStep === 0) {
                box.className = "status neutral";
                box.innerHTML = `${icon("info", 18)}<div><b>Ready.</b> Press <b>Next</b> or <b>Auto play</b> to begin. ${ALGOS[algorithm].rule}.</div>`;
                return;
            }
            const e = history[currentStep - 1];
            box.className = `status ${e.hit ? "hit" : "fault"} pop`;
            box.innerHTML = `${icon(e.hit ? "check" : "bolt", 18)}<div><b>${e.hit ? "HIT" : "PAGE FAULT"} · page ${e.page}.</b> ${escapeHTML(e.reason)}</div>`;
        }

        function renderQueue() {
            const box = host.querySelector("#queue");
            const hint = host.querySelector("#queueHint");
            const cur = currentStep ? history[currentStep - 1] : null;
            if (!cur) {
                box.innerHTML = `<span class="muted">Memory is empty.</span>`;
                hint.textContent = "";
                return;
            }
            box.innerHTML = cur.order.map((o, i) => `
                <div class="q-item ${i === 0 && cur.order.length >= frameCount ? "first" : ""}" style="--i:${i}">
                    <b>${o.page}</b><small>${o.label}</small>
                </div>`).join("");
            hint.textContent = cur.order.length >= frameCount
                ? `Leftmost page is evicted on the next fault (${ALGOS[algorithm].rule.toLowerCase()}).`
                : "Memory still has free frames — nothing will be evicted yet.";
        }

        function renderLiveNotebook() {
            const box = host.querySelector("#liveNotebook");
            box.innerHTML = notebook(history, frameCount, currentStep);
            const sc = box.querySelector(".nb-scroll");
            const cur = box.querySelector("th.cur");
            if (sc && cur) sc.scrollTo({ left: cur.offsetLeft - sc.clientWidth / 2, behavior: "smooth" });
        }

        function renderHistory() {
            const body = host.querySelector("#historyBody");
            if (!currentStep) {
                body.innerHTML = `<tr><td colspan="5" class="empty-row">No steps completed yet.</td></tr>`;
                return;
            }
            body.innerHTML = history.slice(0, currentStep).map((e, i) => `
                <tr class="${e.hit ? "hit-row" : "fault-row"} ${i === currentStep - 1 ? "new-row" : ""}">
                    <td>${e.index + 1}</td>
                    <td><b>${e.page}</b></td>
                    <td><span class="result-badge ${e.hit ? "hit" : "fault"}">${e.event}</span></td>
                    <td class="mono">${e.after.join("  |  ")}</td>
                    <td>${e.victim === null ? "—" : e.victim}</td>
                </tr>`).join("");
            const sc = host.querySelector("#logScroll");
            sc.scrollTop = sc.scrollHeight;
        }

        function renderCompletion() {
            const card = host.querySelector("#completionCard");
            if (currentStep < history.length || !history.length) { card.hidden = true; return; }
            const s = stats(history);
            const wasHidden = card.hidden;
            card.hidden = false;
            if (wasHidden) { card.classList.remove("show"); void card.offsetWidth; card.classList.add("show"); }
            card.innerHTML = `
                <div class="completion-check">${icon("check", 22)}</div>
                <div class="completion-text">
                    <span class="kicker good">SIMULATION COMPLETE</span>
                    <h3>${algorithm} finished ${referenceString.length} references</h3>
                    <p><b>${s.faults}</b> page faults · <b>${s.hits}</b> page hits · hit ratio <b>${(s.hitRatio * 100).toFixed(1)}%</b></p>
                </div>
                <div class="completion-actions">
                    <button class="btn" data-go="compare">${icon("compare", 16)} Compare</button>
                    <button class="btn primary" data-go="calculator">${icon("calc", 16)} Full solution</button>
                </div>`;
            card.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));
        }

        /* ------------------------------------------------------------------
           Dashboard 4 — Compare
        ------------------------------------------------------------------ */
        function frameSweep(algo) {
            const out = [];
            for (let f = 1; f <= MAX_FRAMES; f++) out.push(stats(simulate(algo, referenceString, f)).faults);
            return out;
        }

        function comparePage() {
            const algos = ["FIFO", "LRU", "OPT"];
            const sims = {};
            algos.forEach(a => sims[a] = simulate(a, referenceString, frameCount));
            const st = {};
            algos.forEach(a => st[a] = stats(sims[a]));
            const best = Math.min(...algos.map(a => st[a].faults));
            const n = referenceString.length;

            const diff = st.FIFO.faults - st.LRU.faults;
            let insight;
            if (diff > 0) insight = `<b>LRU saved ${diff} fault${diff > 1 ? "s" : ""}</b> compared with FIFO (${pct(diff, st.FIFO.faults, 0)}% fewer) on this string.`;
            else if (diff < 0) insight = `<b>FIFO beat LRU by ${-diff} fault${-diff > 1 ? "s" : ""}</b> here. That happens on some patterns, such as loops slightly larger than memory.`;
            else insight = `<b>FIFO and LRU tie</b> with ${st.FIFO.faults} faults. OPT needs ${st.OPT.faults}, the theoretical minimum for this input.`;

            const sweeps = {};
            algos.forEach(a => sweeps[a] = frameSweep(a));
            const belady = [];
            for (let i = 1; i < MAX_FRAMES; i++) if (sweeps.FIFO[i] > sweeps.FIFO[i - 1]) belady.push([i, i + 1]);

            return `
            ${configBar({ algo: false })}

            <section class="grid-3" data-reveal>
                ${algos.map(a => `
                <div class="card cmp ${ALGOS[a].cls} ${st[a].faults === best ? "winner" : ""}">
                    <div class="card-head">${algoBadge(a)}${st[a].faults === best ? `<span class="pill good">Fewest faults</span>` : ""}</div>
                    <div class="cmp-num">${st[a].faults}<small>faults</small></div>
                    <div class="cmp-sub">${st[a].hits} hit${st[a].hits === 1 ? "" : "s"} · hit ratio ${(st[a].hitRatio * 100).toFixed(1)}%</div>
                    <div class="bar-track thin"><div class="bar-fill ${ALGOS[a].cls}" style="--w:${st[a].hitRatio * 100}%"></div></div>
                </div>`).join("")}
            </section>

            <article class="callout" data-reveal>${icon("info", 20)}<div>${insight}</div></article>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">STEP-BY-STEP</span><h2>Hit / fault timeline</h2></div><span class="pill">${frameCount} frames</span></div>
                <div class="table-scroll"><table class="strip">
                    <thead><tr><th>Page</th>${referenceString.map(p => `<th>${p}</th>`).join("")}</tr></thead>
                    <tbody>
                        ${algos.map(a => `<tr><th>${algoBadge(a)}</th>${sims[a].map((s, i) => `<td style="--d:${i * 25}ms"><span class="hf ${s.hit ? "h" : "f"}">${s.hit ? "H" : "F"}</span></td>`).join("")}</tr>`).join("")}
                    </tbody>
                </table></div>
            </section>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">SENSITIVITY</span><h2>Faults vs. number of frames</h2></div>
                    <div class="legend">${algos.map(a => `<span><i class="${ALGOS[a].cls}"></i>${a}</span>`).join("")}</div></div>
                ${chartSVG(sweeps, n)}
                ${belady.length
                    ? `<div class="callout warn inline">${icon("bolt", 20)}<div><b>Belady's anomaly detected.</b> With FIFO, going from ${belady.map(b => `${b[0]} to ${b[1]} frames`).join(" and from ")} <i>increased</i> the faults (${belady.map(b => `${sweeps.FIFO[b[0] - 1]} → ${sweeps.FIFO[b[1] - 1]}`).join(", ")}). LRU and OPT never do this.</div></div>`
                    : `<p class="muted small">Tip: load the <a href="#" data-example="belady">Belady's anomaly</a> example to see FIFO get worse with more frames.</p>`}
            </section>`;
        }

        function chartSVG(sweeps, n) {
            const W = 900, H = 290, m = { l: 44, r: 16, t: 14, b: 40 };
            const iw = W - m.l - m.r, ih = H - m.t - m.b;
            const tickStep = Math.max(1, Math.ceil(Math.max(n, 1) / 4));
            const maxY = tickStep * 4;
            const x = f => m.l + ((f - 1) / (MAX_FRAMES - 1)) * iw;
            const y = v => m.t + ih - (v / maxY) * ih;
            const ticks = 4;
            let g = "";
            for (let i = 0; i <= ticks; i++) {
                const v = tickStep * i;
                g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`;
            }
            for (let f = 1; f <= MAX_FRAMES; f++) g += `<text x="${x(f)}" y="${H - 14}" text-anchor="middle" class="axis">${f}</text>`;
            g += `<text x="${m.l + iw / 2}" y="${H - 2}" text-anchor="middle" class="axis-title">number of frames</text>`;
            g += `<line x1="${x(frameCount)}" x2="${x(frameCount)}" y1="${m.t}" y2="${m.t + ih}" class="current-line"/>`;
            Object.keys(sweeps).forEach(a => {
                const pts = sweeps[a].map((v, i) => [x(i + 1), y(v)]);
                g += `<path d="${pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}" pathLength="1" class="line ${ALGOS[a].cls}"/>`;
                pts.forEach((p, i) => g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i + 1 === frameCount ? 5 : 3.5}" class="dot ${ALGOS[a].cls}"><title>${a}: ${sweeps[a][i]} faults with ${i + 1} frame${i ? "s" : ""}</title></circle>`);
            });
            return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Page faults versus number of frames for FIFO, LRU and OPT">${g}</svg></div>`;
        }

        function bindCompare() {
            bindConfigBar();
            host.querySelectorAll("[data-example]").forEach(b => b.addEventListener("click", e => {
                e.preventDefault();
                loadExample(EXAMPLES.find(x => x.id === b.dataset.example), "compare");
            }));
        }

        /* ------------------------------------------------------------------
           Dashboard 5 — Calculator
        ------------------------------------------------------------------ */
        function calculatorPage() {
            const hist = history;
            const s = stats(hist);
            const n = referenceString.length;
            const algos = ["FIFO", "LRU", "OPT"];
            const all = algos.map(a => ({ a, s: stats(simulate(a, referenceString, frameCount)) }));
            const maxF = Math.max(...all.map(r => r.s.faults), 1);
            if (eat.pFromSolution) eat.p = +(s.faultRatio * 100).toFixed(2);

            return `
            ${configBar({ algo: true })}

            <section class="grid-4" data-reveal>
                <div class="metric"><span>References</span><strong>${n}</strong><small>Total pages requested</small></div>
                <div class="metric bad"><span>Page faults</span><strong>${s.faults}</strong><small>Count of F</small></div>
                <div class="metric good"><span>Page hits</span><strong>${s.hits}</strong><small>Count of H</small></div>
                <div class="metric"><span>Frames</span><strong>${frameCount}</strong><small>${algoBadge(algorithm)}</small></div>
            </section>

            <section class="grid-2 even" data-reveal>
                <article class="card">
                    <div class="card-head"><div><span class="kicker">WORKING</span><h2>Ratios, with the calculation</h2></div></div>
                    <div class="calc-line"><span>Hits</span><code>${n} − ${s.faults} = <b>${s.hits}</b></code></div>
                    <div class="calc-line good"><span>Hit ratio</span><code>${s.hits} ÷ ${n} × 100 = <b>${(s.hitRatio * 100).toFixed(2)}%</b></code></div>
                    <div class="calc-line bad"><span>Fault ratio</span><code>${s.faults} ÷ ${n} × 100 = <b>${(s.faultRatio * 100).toFixed(2)}%</b></code></div>
                    <div class="calc-line"><span>Check</span><code>${s.faults} + ${s.hits} = ${s.faults + s.hits} ${s.faults + s.hits === n ? "✓" : "✗"}</code></div>
                </article>
                <article class="card">
                    <div class="card-head"><div><span class="kicker">COMPARISON</span><h2>Same input, all algorithms</h2></div></div>
                    <div class="bars">
                        ${all.map(r => `
                        <div class="bar-row">
                            <span class="bar-label">${algoBadge(r.a)}</span>
                            <div class="bar-track"><div class="bar-fill ${ALGOS[r.a].cls}" style="--w:${(r.s.faults / maxF) * 100}%"></div></div>
                            <b class="bar-val">${r.s.faults}</b>
                        </div>`).join("")}
                    </div>
                    <p class="muted small">Bars show page faults. OPT is a theoretical lower bound — it needs knowledge of future references.</p>
                </article>
            </section>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">FULL SOLUTION</span><h2>${algoBadge(algorithm)} notebook table</h2></div>
                    <button class="btn" id="copyCsv" type="button">Copy as text</button></div>
                ${notebook(hist, frameCount)}
            </section>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">EXPLAINED</span><h2>Why each step happened</h2></div>
                    <button class="btn ghost" id="toggleSteps" type="button">Expand all</button></div>
                <div class="acc-list" id="stepList">
                    ${hist.map(e => `
                    <div class="acc">
                        <button class="acc-head" type="button">
                            <span class="hf ${e.hit ? "h" : "f"}">${e.hit ? "H" : "F"}</span>
                            <span class="acc-title">Step ${e.index + 1} · page <b>${e.page}</b></span>
                            <span class="acc-frames mono">${e.after.join(" | ")}</span>
                            <span class="acc-caret">${icon("next", 14)}</span>
                        </button>
                        <div class="acc-body"><div>${escapeHTML(e.reason)}</div></div>
                    </div>`).join("")}
                </div>
            </section>

            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">PERFORMANCE</span><h2>Effective access time (EAT)</h2></div>
                    <button class="btn ghost" id="eatUse" type="button">Use this fault ratio</button></div>
                <p class="muted">How much do page faults slow memory down? <code>EAT = (1 − p) × ma + p × page-fault time</code></p>
                <div class="eat-grid">
                    <label class="field"><span>Memory access (ns)</span><input class="input" id="eatMa" type="number" min="1" step="any" value="${eat.ma}"></label>
                    <label class="field"><span>Page-fault service (ms)</span><input class="input" id="eatPf" type="number" min="0.001" step="any" value="${eat.pf}"></label>
                    <label class="field"><span>Fault rate p (%)</span><input class="input" id="eatP" type="number" min="0" max="100" step="any" value="${eat.p}"></label>
                </div>
                <div id="eatResult" class="eat-result"></div>
            </section>`;
        }

        function bindCalculator() {
            bindConfigBar();
            host.querySelector("#copyCsv").addEventListener("click", () => {
                const lines = [`Algorithm: ${algorithm}, frames: ${frameCount}`, "Page:   " + history.map(s => s.page).join("\t")];
                for (let r = 0; r < frameCount; r++) lines.push(`Frame ${r + 1}: ` + history.map(s => s.after[r] ?? "-").join("\t"));
                lines.push("Result: " + history.map(s => s.hit ? "H" : "F").join("\t"));
                const s = stats(history);
                lines.push(`Faults=${s.faults} Hits=${s.hits} HitRatio=${(s.hitRatio * 100).toFixed(2)}%`);
                const text = lines.join("\n");
                (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
                    .then(() => toast("Solution copied to clipboard", "success"))
                    .catch(() => toast("Copy is not available in this browser", "error"));
            });
            const list = host.querySelector("#stepList");
            let expanded = false;
            host.querySelector("#toggleSteps").addEventListener("click", e => {
                expanded = !expanded;
                list.querySelectorAll(".acc").forEach(a => a.classList.toggle("open", expanded));
                e.currentTarget.textContent = expanded ? "Collapse all" : "Expand all";
            });
            list.querySelectorAll(".acc-head").forEach(h => h.addEventListener("click", () => h.parentElement.classList.toggle("open")));

            ["eatMa", "eatPf", "eatP"].forEach(id => host.querySelector("#" + id).addEventListener("input", () => {
                eat.pFromSolution = false;
                renderEat();
            }));
            host.querySelector("#eatUse").addEventListener("click", () => {
                const s = stats(history);
                host.querySelector("#eatP").value = +(s.faultRatio * 100).toFixed(2);
                renderEat();
                toast("Fault ratio copied into the EAT calculator", "success");
            });
            renderEat();
        }

        function fmtTime(ns) {
            if (ns >= 1e6) return `${(ns / 1e6).toFixed(3)} ms`;
            if (ns >= 1e3) return `${(ns / 1e3).toFixed(2)} µs`;
            return `${ns.toFixed(2)} ns`;
        }

        function renderEat() {
            const ma = parseFloat(host.querySelector("#eatMa").value);
            const pf = parseFloat(host.querySelector("#eatPf").value);
            const pp = parseFloat(host.querySelector("#eatP").value);
            const box = host.querySelector("#eatResult");
            if (![ma, pf, pp].every(Number.isFinite) || ma <= 0 || pf <= 0 || pp < 0 || pp > 100) {
                box.innerHTML = `<div class="status neutral">${icon("info", 18)}<div>Enter positive values (fault rate between 0 and 100).</div></div>`;
                return;
            }
            eat.ma = ma; eat.pf = pf; eat.p = pp;
            const p = pp / 100;
            const pfNs = pf * 1e6;
            const val = (1 - p) * ma + p * pfNs;
            const slow = val / ma;
            const limit = pfNs > ma ? (0.1 * ma / (pfNs - ma)) * 100 : 100;
            box.innerHTML = `
                <div class="calc-line"><span>Substitute</span><code>(1 − ${p}) × ${ma} + ${p} × ${pfNs.toLocaleString()}</code></div>
                <div class="eat-cards">
                    <div class="metric"><span>EAT</span><strong>${fmtTime(val)}</strong><small>${val.toLocaleString(undefined, { maximumFractionDigits: 2 })} ns</small></div>
                    <div class="metric ${slow > 2 ? "bad" : "good"}"><span>Slowdown</span><strong>${slow >= 100 ? slow.toFixed(0) : slow.toFixed(2)}×</strong><small>compared with ${ma} ns</small></div>
                    <div class="metric"><span>For ≤ 10% slowdown</span><strong>p &lt; ${limit >= 0.01 ? limit.toFixed(3) : limit.toFixed(6).replace(/0+$/, "")}%</strong><small>≈ 1 fault per ${Math.round(100 / limit).toLocaleString()} accesses</small></div>
                </div>`;
        }

        /* ------------------------------------------------------------------
           Dashboard 6 — Examples
        ------------------------------------------------------------------ */
        function examplesPage() {
            return `
            <section class="page-intro" data-reveal>
                <span class="kicker">EXAMPLE LIBRARY</span>
                <h2>Pick a string, then simulate or calculate it</h2>
                <p class="muted">Each card shows the fault count for FIFO, LRU and OPT with the frames given.</p>
            </section>
            <section class="grid-3 examples" data-reveal>
                ${EXAMPLES.map(ex => {
                const res = ["FIFO", "LRU", "OPT"].map(a => ({ a, s: stats(simulate(a, ex.refs, ex.frames)) }));
                const mx = Math.max(...res.map(r => r.s.faults), 1);
                return `
                <article class="card example">
                    <div class="card-head"><div><h3>${ex.title}</h3></div><span class="pill">${ex.frames} frame${ex.frames > 1 ? "s" : ""}</span></div>
                    <p class="muted">${ex.desc}</p>
                    <div class="mini-refs">${ex.refs.map(p => `<span>${p}</span>`).join("")}</div>
                    <div class="bars compact">
                        ${res.map(r => `<div class="bar-row"><span class="bar-label">${algoBadge(r.a)}</span><div class="bar-track thin"><div class="bar-fill ${ALGOS[r.a].cls}" style="--w:${(r.s.faults / mx) * 100}%"></div></div><b class="bar-val">${r.s.faults}</b></div>`).join("")}
                    </div>
                    <div class="row-actions">
                        <button class="btn primary" data-load="${ex.id}" data-target="simulator">${icon("play", 14)} Simulate</button>
                        <button class="btn" data-load="${ex.id}" data-target="calculator">${icon("calc", 14)} Calculate</button>
                    </div>
                </article>`;
            }).join("")}
            </section>
            <section class="card" data-reveal>
                <div class="card-head"><div><span class="kicker">CHALLENGE</span><h2>Make your own</h2></div></div>
                <p class="muted">Use the shuffle button on any dashboard to create a random string, or type your own in the workspace bar. Try to find a string where FIFO beats LRU!</p>
                <div class="row-actions"><button class="btn primary" data-random>${icon("shuffle", 16)} Random string → Compare</button></div>
            </section>`;
        }

        function bindExamples() {
            host.querySelectorAll("[data-load]").forEach(b => b.addEventListener("click", () => {
                loadExample(EXAMPLES.find(e => e.id === b.dataset.load), b.dataset.target);
            }));
            host.querySelector("[data-random]").addEventListener("click", () => {
                referenceString = randomRefs(14, Math.max(4, frameCount + 3));
                buildHistory();
                showTab("compare");
                toast("Random string generated", "success");
            });
        }

        /* ------------------------------------------------------------------
           Dashboard 7 — Practice
        ------------------------------------------------------------------ */
        function newPractice() {
            const frames = 3;
            const refs = randomRefs(10, 5);
            const hist = simulate(practiceAlgo, refs, frames);
            const max = hist.reduce((t, s) => t + 1 + (s.full ? 1 : 0), 0);
            practice = { algo: practiceAlgo, refs, frames, hist, i: 0, phase: "guess", score: 0, max, streak: 0, best: 0, guess: null, pick: null };
        }

        function practicePage() {
            if (!practice) newPractice();
            return `
            <section class="card config practice-bar" data-reveal>
                <div class="field"><label>Algorithm</label>${segmented("prAlgo", ["FIFO", "LRU"], practiceAlgo)}</div>
                <div class="field grow"><label>How it works</label><div class="muted">For every reference, predict <b>hit or fault</b>. If memory is full and a fault occurs, also pick the <b>victim</b>. 3 frames.</div></div>
                <div class="field"><label class="ghost-label">&nbsp;</label><button class="btn primary" id="prNew" type="button">${icon("shuffle", 16)} New round</button></div>
            </section>
            <div id="practiceBody" class="practice-body" data-reveal></div>`;
        }

        function bindPractice() {
            host.querySelectorAll("#prAlgo .seg-btn").forEach(b => b.addEventListener("click", () => {
                practiceAlgo = b.dataset.value;
                newPractice();
                showTab("practice", { soft: true });
            }));
            host.querySelector("#prNew").addEventListener("click", () => { newPractice(); showTab("practice", { soft: true }); });
            renderPractice();
        }

        function renderPractice() {
            const p = practice;
            const body = host.querySelector("#practiceBody");
            const done = p.i >= p.refs.length;
            const step = done ? null : p.hist[p.i];
            const prev = p.i > 0 ? p.hist[p.i - 1].after : [];
            const memNow = p.phase === "reveal" && step ? step.after : prev;

            const stream = p.refs.map((pg, i) => {
                let st = "";
                if (i < p.i || (i === p.i && p.phase === "reveal")) st = p.hist[i].hit ? "was-hit" : "was-fault";
                if (i === p.i && !done) st += p.phase === "reveal" ? " current" : " upcoming";
                return `<div class="chip-ref ${st}"><span class="ref-index">${i + 1}</span><b>${pg}</b></div>`;
            }).join("");

            let panel = "";
            if (done) {
                const ratio = p.max ? Math.round((p.score / p.max) * 100) : 0;
                const msg = ratio >= 90 ? "Outstanding — exam ready." : ratio >= 70 ? "Solid. Review the misses and go again." : "Keep practising — re-read the notebook method in Theory.";
                panel = `<div class="practice-done">
                    <div class="completion-check">${icon("check", 22)}</div>
                    <h3>${p.score} / ${p.max} correct · ${ratio}%</h3>
                    <p class="muted">${msg} Longest streak: <b>${p.best}</b>.</p>
                    <div class="row-actions center"><button class="btn primary" id="prAgain">${icon("shuffle", 16)} New round</button><button class="btn" data-go="theory">${icon("book", 16)} Review theory</button></div>
                </div>`;
            } else if (p.phase === "guess") {
                panel = `<div class="question">
                    <span class="kicker">QUESTION ${p.i + 1} OF ${p.refs.length}</span>
                    <h3>Page <span class="q-page">${step.page}</span> is requested. Hit or fault?</h3>
                    <div class="answer-row">
                        <button class="btn answer h" data-guess="hit">${icon("check", 18)} Hit</button>
                        <button class="btn answer f" data-guess="fault">${icon("bolt", 18)} Page fault</button>
                    </div>
                </div>`;
            } else if (p.phase === "victim") {
                panel = `<div class="question">
                    <span class="kicker">QUESTION ${p.i + 1} OF ${p.refs.length}</span>
                    <div class="feedback ${p.guess.correct ? "good" : "bad"}">${icon(p.guess.correct ? "check" : "x", 16)} ${p.guess.correct ? "Correct — it is a page fault." : "Not quite — it is a page fault."}</div>
                    <h3>Memory is full. Which page does ${p.algo} evict?</h3>
                    <div class="answer-row">${prev.map(v => `<button class="btn answer pick" data-victim="${v}">${v}</button>`).join("")}</div>
                </div>`;
            } else {
                const lines = [];
                lines.push(`<div class="feedback ${p.guess.correct ? "good" : "bad"}">${icon(p.guess.correct ? "check" : "x", 16)} ${p.guess.correct ? "Correct" : "Incorrect"} — ${step.hit ? "hit" : "fault"}.</div>`);
                if (p.pick !== null) lines.push(`<div class="feedback ${p.pick.correct ? "good" : "bad"}">${icon(p.pick.correct ? "check" : "x", 16)} ${p.pick.correct ? "Correct victim" : `Wrong victim — page ${step.victim} was evicted`}.</div>`);
                panel = `<div class="question">
                    <span class="kicker">EXPLANATION</span>
                    ${lines.join("")}
                    <div class="status ${step.hit ? "hit" : "fault"}">${icon(step.hit ? "check" : "bolt", 18)}<div>${escapeHTML(step.reason)}</div></div>
                    <div class="row-actions"><button class="btn primary" id="prNext">${p.i + 1 >= p.refs.length ? "Finish" : "Next question"} ${icon("next", 16)}</button></div>
                </div>`;
            }

            body.innerHTML = `
            <section class="card">
                <div class="card-head"><div><span class="kicker">REFERENCE STREAM</span><h2>Round progress</h2></div>
                    <div class="score-group"><span class="pill">Score ${p.score}/${p.max}</span><span class="pill ${p.streak >= 3 ? "good" : ""}">${p.streak >= 3 ? "🔥 " : ""}Streak ${p.streak}</span></div></div>
                <div class="stream static">${stream}</div>
            </section>
            <div class="grid-2 sim">
                <section class="card question-card">
                    ${panel}
                </section>
                <section class="card">
                    <div class="card-head"><div><span class="kicker">MAIN MEMORY</span><h2>Frames now</h2></div>${algoBadge(p.algo)}</div>
                    <div class="frames">${Array.from({ length: p.frames }, (_, i) => {
                const v = memNow[i];
                const isNew = p.phase === "reveal" && step && !step.hit && step.slot === i;
                return `<div class="frame ${v === undefined ? "empty" : "filled"} ${isNew ? "updated" : ""}"><span class="frame-label">Frame ${i + 1}</span><div class="frame-value">${v === undefined ? "—" : v}</div></div>`;
            }).join("")}</div>
                    <p class="muted small">${p.phase === "reveal" ? "Frames after this reference." : "Frames before this reference."}</p>
                </section>
            </div>`;

            const cur = body.querySelector(".stream .upcoming, .stream .current");
            const sc = body.querySelector(".stream");
            if (cur) sc.scrollLeft = cur.offsetLeft - sc.clientWidth / 2;

            body.querySelectorAll("[data-guess]").forEach(b => b.addEventListener("click", () => {
                const choice = b.dataset.guess;
                const correct = (choice === "hit") === step.hit;
                p.guess = { choice, correct };
                if (correct) { p.score++; p.streak++; p.best = Math.max(p.best, p.streak); } else p.streak = 0;
                p.pick = null;
                p.phase = !step.hit && step.full ? "victim" : "reveal";
                renderPractice();
            }));
            body.querySelectorAll("[data-victim]").forEach(b => b.addEventListener("click", () => {
                const v = Number(b.dataset.victim);
                const correct = v === step.victim;
                p.pick = { choice: v, correct };
                if (correct) { p.score++; p.streak++; p.best = Math.max(p.best, p.streak); } else p.streak = 0;
                p.phase = "reveal";
                renderPractice();
            }));
            const next = body.querySelector("#prNext");
            if (next) next.addEventListener("click", () => { p.i++; p.phase = "guess"; p.guess = null; p.pick = null; renderPractice(); });
            const again = body.querySelector("#prAgain");
            if (again) again.addEventListener("click", () => { newPractice(); showTab("practice", { soft: true }); });
            body.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));
        }

        /* ------------------------------------------------------------------
           Public interface
        ------------------------------------------------------------------ */
        function getMetrics() {
            return {
                primaryMetricLabel: "Page Faults",
                primaryMetricValue: countFaults(),
                unit: "faults"
            };
        }

        return {
            render,
            reset,
            getMetrics
        };
    })();
})();
