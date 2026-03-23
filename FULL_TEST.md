# Full Benchmark Test Plan: Server Components vs Client Components

## Table of Contents

- [1. Overview](#1-overview)
- [2. Prerequisites](#2-prerequisites)
- [3. Branch Architecture](#3-branch-architecture)
- [4. Test 1 — View Source (Initial HTML)](#4-test-1--view-source-initial-html)
- [5. Test 2 — Bundle Analysis](#5-test-2--bundle-analysis)
- [6. Test 3 — Network Tab Analysis](#6-test-3--network-tab-analysis)
- [7. Test 4 — Lighthouse Audit](#7-test-4--lighthouse-audit)
- [8. Test 5 — Web Vitals Collection](#8-test-5--web-vitals-collection)
- [9. Test 6 — Performance Profiling (Chrome DevTools)](#9-test-6--performance-profiling-chrome-devtools)
- [10. Test 7 — JavaScript Coverage](#10-test-7--javascript-coverage)
- [11. Automated Console Scripts](#11-automated-console-scripts)
- [12. Results Template](#12-results-template)
- [13. How to Present Your Findings](#13-how-to-present-your-findings)

---

## 1. Overview

This benchmark compares two architectures for the same dashboard UI (same features, same data, same visual output):

| Branch   | Strategy                              | Key trait                                         |
| -------- | ------------------------------------- | ------------------------------------------------- |
| `main`   | **Test A** — All Client Components    | `layout.tsx` and `page.tsx` use `'use client'`    |
| `test-b` | **Test B** — Server + Client Wrappers | `layout.tsx` and `page.tsx` are Server Components |

Both branches render the same dashboard at `http://localhost:3000/` with:

- Sidebar navigation (collapsible)
- Header with sidebar toggle
- 4 summary cards (total products, avg price, avg rating, total stock)
- Search, category filter, sort controls
- Product table with 194 items from DummyJSON API (thumbnail, name, brand, category, price, rating, stock)
- Web Vitals reporter (logs to console + `window.__WEB_VITALS`)

The **only difference** is the component boundary strategy.

---

## 2. Prerequisites

### Software

- Node.js 20.9+
- pnpm (the project uses pnpm)
- Google Chrome (for DevTools, Lighthouse, Performance tab)
- Git

### Install dependencies (run once)

```bash
pnpm install
```

### Important rules for valid benchmarks

1. **Always test production builds**, never `pnpm dev`
2. **Close all other Chrome tabs** before measuring
3. **Disable Chrome extensions** (use Incognito or a clean profile)
4. **Use the same network conditions** for both tests
5. **Run Lighthouse at least 5 times** per branch and take the median
6. **Clear `.next/` between branch switches** to avoid stale caches

---

## 3. Branch Architecture

### Test A — `main` branch (anti-pattern)

```
src/app/
├── layout.tsx                              ← SERVER (root: html, body, fonts, WebVitals)
├── globals.css
└── (dashboard)/
    ├── layout.tsx                          ← 'use client' (110 lines)
    │                                         Sidebar context + state + Sidebar component +
    │                                         Header component + layout JSX all in ONE file
    ├── page.tsx                            ← 'use client' (90 lines)
    │                                         useEffect fetch + useState loading/error +
    │                                         search/category/sort state + filtering logic +
    │                                         render SummaryCards + Filters + ProductTable
    └── _components/
        ├── summary-cards.tsx               ← 'use client' (useMemo for stats)
        ├── filters.tsx                     ← 'use client' (controlled inputs)
        ├── product-table.tsx               ← 'use client' (renders 194 rows with Image)
        └── web-vitals.tsx                  ← 'use client' (useReportWebVitals hook)
```

**What happens on page load (Test A):**

1. Server renders `page.tsx` → `loading` state is `true` → **HTML contains only a spinner**
2. Browser downloads all JS for layout + page + every child component
3. React hydrates the entire component tree
4. `useEffect` fires → browser makes `fetch("https://dummyjson.com/products?limit=0")`
5. Response arrives → `setProducts(data)` → React re-renders → table appears
6. User sees: **blank → spinner → data** (two layout shifts)

**Problems:**

- Every component is in the client bundle (even pure-display ones)
- Data is fetched client-side after hydration (waterfall)
- Initial HTML has no meaningful content
- The layout file is 110+ lines mixing concerns

---

### Test B — `test-b` branch (best practice)

```
src/app/
├── layout.tsx                              ← SERVER (root: html, body, fonts, WebVitals)
├── globals.css
└── (dashboard)/
    ├── layout.tsx                          ← SERVER (20 lines)
    │                                         Imports DashboardLayoutClient + Sidebar + Header
    │                                         Pure composition, no state, no 'use client'
    ├── page.tsx                            ← SERVER + async (25 lines)
    │                                         async function getProducts() fetches on server
    │                                         Renders SummaryCards (server) + passes data
    │                                         to DashboardPageClient (client wrapper)
    ├── dashboard-page-client.tsx           ← 'use client' (70 lines)
    │                                         ONLY search/category/sort state + filtering
    │                                         Renders Filters + ProductTable
    └── _components/
        ├── dashboard-layout-client.tsx     ← 'use client' (sidebar context provider ONLY)
        ├── sidebar.tsx                     ← 'use client' (consumes sidebar context)
        ├── header.tsx                      ← 'use client' (consumes sidebar context)
        ├── summary-cards.tsx               ← SERVER (pure display, no 'use client')
        ├── filters.tsx                     ← 'use client' (controlled inputs)
        ├── product-table.tsx               ← SERVER (pure display, no 'use client')
        └── web-vitals.tsx                  ← 'use client' (useReportWebVitals hook)
```

**What happens on page load (Test B):**

1. Server runs `async getProducts()` → fetches data from DummyJSON **on the server**
2. Server renders `SummaryCards` and `ProductTable` **with real data** → full HTML
3. Browser receives **complete HTML with 194 product rows already rendered**
4. Browser downloads only the JS needed for interactive parts (filters, sidebar toggle)
5. React hydrates only the client components
6. User sees: **full dashboard immediately** (no spinner, no layout shift)

**Gains:**

- `summary-cards.tsx` and `product-table.tsx` ship **zero JS** to the browser
- Data is already in the HTML (no client-side fetch waterfall)
- Layout file is 20 lines of clean composition
- Each file has one clear responsibility

---

## 4. Test 1 — View Source (Initial HTML)

This is the most visually convincing test. It shows what the browser receives before any JavaScript runs.

### Steps

```bash
# ============================================
# TEST A — main branch
# ============================================
git checkout main
rm -rf .next
pnpm build
pnpm start

# Open Chrome → go to http://localhost:3000/
# Press Ctrl+U (or Cmd+Option+U on Mac) to View Page Source
# Save the page source or take a screenshot
# Press Ctrl+C in terminal to stop the server

# ============================================
# TEST B — test-b branch
# ============================================
git checkout test-b
rm -rf .next
pnpm build
pnpm start

# Open Chrome → go to http://localhost:3000/
# Press Ctrl+U to View Page Source
# Save the page source or take a screenshot
# Press Ctrl+C in terminal to stop the server
```

### What to look for

| Aspect                    | Test A (main)                           | Test B (test-b)                                   |
| ------------------------- | --------------------------------------- | ------------------------------------------------- |
| Product data in HTML      | **NO** — only a loading spinner `<div>` | **YES** — 194 `<tr>` rows with product data       |
| Summary cards             | **Empty** — rendered after JS loads     | **Populated** — values in the HTML                |
| Search/filter UI          | **Missing** — rendered after JS + fetch | **Present** — inputs rendered in HTML             |
| Useful without JavaScript | **No** — page is a spinner without JS   | **Partially** — data is readable, filters need JS |

### How to measure HTML size

Open DevTools → Network tab → refresh → click the document request → check **Size** and **Content-Length**.

Or use curl:

```bash
# While pnpm start is running on each branch:
curl -s http://localhost:3000/ | wc -c
```

Record the byte count for both branches. Test B's HTML should be significantly larger (it contains the data), while Test A's HTML is small (just a spinner shell).

---

## 5. Test 2 — Bundle Analysis

This measures how much JavaScript each branch sends to the browser.

### Steps

```bash
# ============================================
# TEST A — main branch
# ============================================
git checkout main
rm -rf .next

# The bundle analyzer requires webpack (Turbopack doesn't support it yet)
ANALYZE=true npx next build --webpack

# This opens two browser tabs automatically:
#   1. Client-side bundle treemap
#   2. Server-side bundle treemap
# Save/screenshot BOTH (focus on the client-side one)

# ============================================
# TEST B — test-b branch
# ============================================
git checkout test-b
rm -rf .next

ANALYZE=true npx next build --webpack

# Save/screenshot both treemaps
```

### What to look for in the client treemap

1. **Total parsed size** of the route chunk(s) — shown at the top of the treemap
2. **Which modules appear** — look for `summary-cards.tsx` and `product-table.tsx`:
   - Test A: they appear in the client bundle (wasted JS)
   - Test B: they should NOT appear (they are Server Components)
3. **The route page chunk size** — compare the `(dashboard)/page` chunk between branches
4. **Layout chunk size** — compare the `(dashboard)/layout` chunk

### Record these numbers

| Metric                                | Test A (main) | Test B (test-b) |
| ------------------------------------- | ------------- | --------------- |
| Total client JS (parsed)              |               |                 |
| Route page chunk size                 |               |                 |
| Layout chunk size                     |               |                 |
| `product-table.tsx` in client bundle? |               |                 |
| `summary-cards.tsx` in client bundle? |               |                 |

---

## 6. Test 3 — Network Tab Analysis

This measures real transfer sizes and the request waterfall.

### Steps

```bash
# Start one branch at a time in production mode:
git checkout main  # or test-b
rm -rf .next
pnpm build
pnpm start
```

1. Open Chrome (Incognito recommended)
2. Open DevTools → **Network** tab
3. Check **Disable cache**
4. Go to `http://localhost:3000/`
5. Wait for page to fully load
6. In the Network tab filter bar, type **JS** to show only JavaScript files

### What to record

| Metric                       | Test A (main) | Test B (test-b) |
| ---------------------------- | ------------- | --------------- |
| Total requests               |               |                 |
| Total JS requests            |               |                 |
| Total JS transferred (KB)    |               |                 |
| Total JS resources size (KB) |               |                 |
| Document size (HTML, KB)     |               |                 |
| DOMContentLoaded time (ms)   |               |                 |
| Load time (ms)               |               |                 |

### Waterfall comparison

Look at the waterfall chart:

**Test A waterfall pattern:**

```
HTML ──→ JS chunks ──→ Hydration ──→ fetch(/products) ──→ Re-render with data
         ^^^^^^^^^^^                  ^^^^^^^^^^^^^^^^^^
         More JS to download          Extra network round-trip
```

**Test B waterfall pattern:**

```
HTML (with data) ──→ JS chunks (fewer) ──→ Hydration (partial)
                     ^^^^^^^^^^^^^^^^^
                     Less JS, no extra API call
```

Screenshot the waterfall for both branches.

---

## 7. Test 4 — Lighthouse Audit

Lighthouse provides standardized lab metrics. Run it in production mode only.

### Steps

```bash
# Start one branch at a time:
git checkout main  # or test-b
rm -rf .next
pnpm build
pnpm start
```

1. Open Chrome (Incognito)
2. Go to `http://localhost:3000/`
3. Open DevTools → **Lighthouse** tab
4. Settings:
   - Mode: **Navigation**
   - Device: **Mobile**
   - Categories: check **Performance** only
5. Click **Analyze page load**
6. **Repeat 5 times** per branch
7. Record the **median** of each metric (not the best, not the worst)

### Metrics to record (per run)

| Metric                         | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | **Median** |
| ------------------------------ | ----- | ----- | ----- | ----- | ----- | ---------- |
| Performance Score              |       |       |       |       |       |            |
| First Contentful Paint (FCP)   |       |       |       |       |       |            |
| Largest Contentful Paint (LCP) |       |       |       |       |       |            |
| Total Blocking Time (TBT)      |       |       |       |       |       |            |
| Cumulative Layout Shift (CLS)  |       |       |       |       |       |            |
| Speed Index                    |       |       |       |       |       |            |

### Fill this comparison table with medians

| Metric            | Test A (main) | Test B (test-b) | Delta |
| ----------------- | ------------- | --------------- | ----- |
| Performance Score |               |                 |       |
| FCP (ms)          |               |                 |       |
| LCP (ms)          |               |                 |       |
| TBT (ms)          |               |                 |       |
| CLS               |               |                 |       |
| Speed Index (ms)  |               |                 |       |

### Also check Lighthouse diagnostics

Scroll down in the Lighthouse report to find:

- **Reduce unused JavaScript** — how much unused JS is shipped
- **Minimize main-thread work** — total main-thread time breakdown
- **Reduce JavaScript execution time** — script evaluation cost
- **Avoid large layout shifts** — which elements shifted

Record or screenshot these sections for both branches.

---

## 8. Test 5 — Web Vitals Collection

Both branches include a `WebVitals` component that logs Core Web Vitals to the browser console and stores them in `window.__WEB_VITALS`.

### Steps

```bash
# Start one branch:
git checkout main  # or test-b
rm -rf .next
pnpm build
pnpm start
```

1. Open Chrome → `http://localhost:3000/`
2. Open DevTools → **Console** tab
3. Hard refresh with **Ctrl+Shift+R** (or Cmd+Shift+R)
4. Wait for page to fully load
5. **Interact with the page** (click sidebar toggle, type in search, change category, scroll the table) — this triggers INP measurement
6. Look for colored log entries like:
   ```
   [Web Vital] LCP: 1200ms (good)          ← green
   [Web Vital] INP: 45ms (good)            ← green
   [Web Vital] CLS: 0.12 (needs-improvement) ← orange
   ```
7. To get all collected metrics as an array, run in console:
   ```js
   console.table(window.__WEB_VITALS);
   ```

### Record these values

| Web Vital | Test A (main) | Rating A | Test B (test-b) | Rating B |
| --------- | ------------- | -------- | --------------- | -------- |
| LCP       |               |          |                 |          |
| INP       |               |          |                 |          |
| CLS       |               |          |                 |          |
| FCP       |               |          |                 |          |
| TTFB      |               |          |                 |          |

### Repeat 3 times per branch and take the median.

---

## 9. Test 6 — Performance Profiling (Chrome DevTools)

This is the deepest analysis — it shows exactly what the main thread is doing during page load.

### Steps

```bash
# Start one branch:
git checkout main  # or test-b
rm -rf .next
pnpm build
pnpm start
```

1. Open Chrome → `http://localhost:3000/`
2. Open DevTools → **Performance** tab
3. Click the **gear icon** (⚙️) in the Performance tab:
   - Check **Screenshots**
   - Set **CPU throttling: 4x slowdown** (simulates a mid-range phone)
   - Set **Network: Fast 3G** (optional, for more realistic conditions)
4. Click the **reload button** (circular arrow) in the Performance tab — this starts recording + refreshes the page
5. Wait for page to fully load, then click **Stop**
6. Save the profile (right-click → Save Profile) for reference

### What to analyze

#### A. Summary pie chart

At the bottom of the Performance tab you will see a summary:

| Category  | Description                 | Test A | Test B |
| --------- | --------------------------- | ------ | ------ |
| Scripting | JavaScript execution time   |        |        |
| Rendering | Layout, style recalculation |        |        |
| Painting  | Pixel rendering             |        |        |
| Loading   | Network/resource loading    |        |        |
| Idle      | Unused time                 |        |        |
| **Total** | Total time recorded         |        |        |

Test B should show **less Scripting** time (fewer client components to hydrate).

#### B. Long Tasks

Look for yellow/red blocks on the **Main** thread flame chart. These are Long Tasks (>50ms) that block user interaction.

| Metric                | Test A (main) | Test B (test-b) |
| --------------------- | ------------- | --------------- |
| Number of Long Tasks  |               |                 |
| Longest Task duration |               |                 |
| Total Long Tasks time |               |                 |

#### C. Screenshot filmstrip

At the top of the recording you can see a filmstrip of how the page appeared over time. Compare:

- **Test A**: blank → spinner → data appears (multiple visual states)
- **Test B**: blank → full dashboard appears (one visual transition)

#### D. Network row

In the Performance panel, look at the **Network** row:

- **Test A**: you will see the HTML request, then JS chunks, then a **separate XHR/fetch to dummyjson.com** (the useEffect API call)
- **Test B**: you will see the HTML request and JS chunks, but **NO separate API call** (data was fetched on the server)

---

## 10. Test 7 — JavaScript Coverage

This shows how much of the downloaded JavaScript is actually used during page load.

### Steps

1. Open Chrome → `http://localhost:3000/`
2. Open DevTools → press **Ctrl+Shift+P** (Command Palette)
3. Type **Coverage** and select **Show Coverage**
4. Click the **reload button** (circular arrow) in the Coverage panel
5. Wait for page to fully load
6. Look at the results table

### What to record

| Metric                | Test A (main) | Test B (test-b) |
| --------------------- | ------------- | --------------- |
| Total JS bytes loaded |               |                 |
| Total JS bytes unused |               |                 |
| % JS unused           |               |                 |

Test B should have a **lower total JS loaded** (Server Components don't ship JS) and potentially a **lower unused percentage** (the JS that IS shipped is actually needed for interactivity).

---

## 11. Automated Console Scripts

Paste these scripts into the browser console to automate data collection.

### Script 1: Collect all performance metrics at once

```js
(function collectMetrics() {
  const nav = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByType("paint");
  const resources = performance.getEntriesByType("resource");

  const jsResources = resources.filter((r) => r.name.endsWith(".js"));
  const totalJsTransferred = jsResources.reduce(
    (sum, r) => sum + r.transferSize,
    0,
  );
  const totalJsDecoded = jsResources.reduce(
    (sum, r) => sum + r.decodedBodySize,
    0,
  );

  const metrics = {
    // Navigation timing
    TTFB: Math.round(nav.responseStart - nav.requestStart),
    DOMContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    LoadComplete: Math.round(nav.loadEventEnd - nav.startTime),
    DOMInteractive: Math.round(nav.domInteractive - nav.startTime),

    // Paint timing
    FCP: paint.find((p) => p.name === "first-contentful-paint")
      ? Math.round(
          paint.find((p) => p.name === "first-contentful-paint").startTime,
        )
      : "N/A",

    // JS bundle metrics
    TotalJSFiles: jsResources.length,
    TotalJSTransferredKB: (totalJsTransferred / 1024).toFixed(1),
    TotalJSDecodedKB: (totalJsDecoded / 1024).toFixed(1),

    // Page weight
    TotalResourcesTransferredKB: (
      resources.reduce((sum, r) => sum + r.transferSize, 0) / 1024
    ).toFixed(1),

    // Document
    HTMLSizeKB: nav.decodedBodySize
      ? (nav.decodedBodySize / 1024).toFixed(1)
      : "N/A",
  };

  console.log("\n📊 Performance Metrics:");
  console.table(metrics);

  // Web Vitals if available
  if (window.__WEB_VITALS && window.__WEB_VITALS.length > 0) {
    console.log("\n🔬 Web Vitals:");
    console.table(
      window.__WEB_VITALS.map((v) => ({
        Metric: v.name,
        Value: v.value.toFixed(2),
        Rating: v.rating,
      })),
    );
  } else {
    console.log(
      "\n⏳ Web Vitals not yet collected. Interact with the page (scroll, click, type) then run again.",
    );
  }

  return metrics;
})();
```

### Script 2: List all JS chunks with sizes

```js
(function listJsChunks() {
  const resources = performance.getEntriesByType("resource");
  const jsFiles = resources
    .filter((r) => r.name.endsWith(".js"))
    .map((r) => ({
      File: r.name.split("/").pop(),
      TransferKB: (r.transferSize / 1024).toFixed(1),
      DecodedKB: (r.decodedBodySize / 1024).toFixed(1),
      Duration: Math.round(r.duration) + "ms",
    }))
    .sort((a, b) => parseFloat(b.DecodedKB) - parseFloat(a.DecodedKB));

  console.log(`\n📦 JS Chunks (${jsFiles.length} files):`);
  console.table(jsFiles);

  const totalTransfer = jsFiles.reduce(
    (s, f) => s + parseFloat(f.TransferKB),
    0,
  );
  const totalDecoded = jsFiles.reduce((s, f) => s + parseFloat(f.DecodedKB), 0);
  console.log(
    `\n📊 Total JS: ${totalTransfer.toFixed(1)} KB transferred, ${totalDecoded.toFixed(1)} KB decoded`,
  );
})();
```

### Script 3: Compare Long Tasks

```js
(function listLongTasks() {
  // Note: PerformanceLongTaskTiming requires PerformanceObserver to have been running
  // This script reads any entries available
  const entries = performance.getEntriesByType("longtask");
  if (entries.length === 0) {
    console.log(
      "No Long Task entries found. To capture these, you need a PerformanceObserver running from page load.",
    );
    console.log(
      "Use the Performance tab (DevTools) instead for Long Task analysis.",
    );
    return;
  }
  const tasks = entries.map((e) => ({
    StartTime: Math.round(e.startTime) + "ms",
    Duration: Math.round(e.duration) + "ms",
  }));
  console.log(`\n🔴 Long Tasks (${tasks.length}):`);
  console.table(tasks);
})();
```

### Script 4: Export all data as JSON (for spreadsheets)

```js
(function exportAll() {
  const nav = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByType("paint");
  const resources = performance.getEntriesByType("resource");
  const jsResources = resources.filter((r) => r.name.endsWith(".js"));

  const data = {
    branch: document.querySelector('[class*="bg-red-100"]')
      ? "main (Test A)"
      : document.querySelector('[class*="bg-green-100"]')
        ? "test-b (Test B)"
        : "unknown",
    timestamp: new Date().toISOString(),
    navigation: {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      domContentLoaded: Math.round(
        nav.domContentLoadedEventEnd - nav.startTime,
      ),
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
      domInteractive: Math.round(nav.domInteractive - nav.startTime),
      htmlSizeBytes: nav.decodedBodySize,
    },
    paint: {
      fcp:
        paint.find((p) => p.name === "first-contentful-paint")?.startTime ||
        null,
    },
    js: {
      fileCount: jsResources.length,
      totalTransferBytes: jsResources.reduce((s, r) => s + r.transferSize, 0),
      totalDecodedBytes: jsResources.reduce((s, r) => s + r.decodedBodySize, 0),
      files: jsResources.map((r) => ({
        name: r.name.split("/").pop(),
        transferBytes: r.transferSize,
        decodedBytes: r.decodedBodySize,
      })),
    },
    webVitals: window.__WEB_VITALS || [],
  };

  const json = JSON.stringify(data, null, 2);
  console.log(json);

  // Copy to clipboard
  navigator.clipboard.writeText(json).then(() => {
    console.log(
      "✅ JSON copied to clipboard! Paste into a file or spreadsheet.",
    );
  });

  return data;
})();
```

---

## 12. Results Template

Copy and fill this template after running all tests.

```markdown
# Benchmark Results: Server Components vs Client Components

**Date:** YYYY-MM-DD
**Machine:** [your machine specs]
**Browser:** Chrome [version]
**Node.js:** [version]
**Next.js:** 16.2.1

## HTML Size (View Source)

| Metric           | Test A (main) | Test B (test-b) | Δ             |
| ---------------- | ------------- | --------------- | ------------- |
| HTML size        | \_\_\_ KB     | \_\_\_ KB       | +/- \_\_\_ KB |
| Products in HTML | No (spinner)  | Yes (194 rows)  | —             |

## Bundle Analysis

| Metric                         | Test A (main) | Test B (test-b) | Δ        |
| ------------------------------ | ------------- | --------------- | -------- |
| Client JS (parsed)             | \_\_\_ KB     | \_\_\_ KB       | -\_\_\_% |
| product-table in client bundle | Yes / No      | Yes / No        | —        |
| summary-cards in client bundle | Yes / No      | Yes / No        | —        |

## Network Tab

| Metric                      | Test A (main) | Test B (test-b) | Δ          |
| --------------------------- | ------------- | --------------- | ---------- |
| JS files count              |               |                 |            |
| JS transferred              | \_\_\_ KB     | \_\_\_ KB       | -\_\_\_%   |
| JS decoded                  | \_\_\_ KB     | \_\_\_ KB       | -\_\_\_%   |
| DOMContentLoaded            | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |
| Load complete               | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |
| Extra API call to dummyjson | Yes           | No              | —          |

## Lighthouse (median of 5 runs, mobile)

| Metric            | Test A (main) | Test B (test-b) | Δ          |
| ----------------- | ------------- | --------------- | ---------- |
| Performance Score |               |                 |            |
| FCP               | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |
| LCP               | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |
| TBT               | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |
| CLS               |               |                 |            |
| Speed Index       | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_ ms |

## Web Vitals (median of 3 runs)

| Vital | Test A (main) | Rating | Test B (test-b) | Rating |
| ----- | ------------- | ------ | --------------- | ------ |
| LCP   | \_\_\_ ms     |        | \_\_\_ ms       |        |
| INP   | \_\_\_ ms     |        | \_\_\_ ms       |        |
| CLS   |               |        |                 |        |

## Performance Profile

| Metric           | Test A (main) | Test B (test-b) | Δ        |
| ---------------- | ------------- | --------------- | -------- |
| Scripting time   | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_% |
| Rendering time   | \_\_\_ ms     | \_\_\_ ms       | -\_\_\_% |
| Long Tasks count |               |                 |          |
| Longest Task     | \_\_\_ ms     | \_\_\_ ms       |          |

## JS Coverage

| Metric          | Test A (main) | Test B (test-b) | Δ        |
| --------------- | ------------- | --------------- | -------- |
| Total JS loaded | \_\_\_ KB     | \_\_\_ KB       | -\_\_\_% |
| JS unused       | \_\_\_ KB     | \_\_\_ KB       | -\_\_\_% |
| % unused        | \_\_\_%       | \_\_\_%         |          |

## Conclusion

[Write 2-3 sentences summarizing the findings]
```

---

## 13. How to Present Your Findings

### For a technical RFC or team discussion

Structure your presentation as:

1. **Hypothesis**: "Keeping page.tsx and layout.tsx as Server Components reduces client JS and improves load performance"
2. **Method**: Describe the two branches, same UI, same API, only the component boundaries differ
3. **Results**: Use the tables from section 12 with actual numbers
4. **Screenshots**: Include bundle treemaps, View Source comparisons, Lighthouse reports, and waterfall charts
5. **Conclusion**: Summarize the delta percentages

### Most impactful evidence (in order)

1. **View Source comparison** — instant visual proof (spinner vs full table)
2. **Bundle treemap screenshots** — shows exactly which modules leaked into client
3. **Lighthouse score comparison** — industry-standard metric everyone understands
4. **Network waterfall screenshots** — shows the extra API round-trip in Test A
5. **JS Coverage numbers** — quantifies wasted bytes

### Quick one-liner commands for the full flow

```bash
# === FULL BENCHMARK RUN ===

# Test A
git checkout main
rm -rf .next
pnpm build
pnpm start
# → Run all tests in Chrome, fill template
# → Ctrl+C to stop server

# Test B
git checkout test-b
rm -rf .next
pnpm build
pnpm start
# → Run all tests in Chrome, fill template
# → Ctrl+C to stop server

# Bundle analysis (requires separate builds with webpack)
git checkout main && rm -rf .next && ANALYZE=true npx next build --webpack
git checkout test-b && rm -rf .next && ANALYZE=true npx next build --webpack
```

---

## Appendix: File-by-file 'use client' Comparison

| File                          | Test A (main)  | Test B (test-b) | Why                                       |
| ----------------------------- | -------------- | --------------- | ----------------------------------------- |
| `layout.tsx`                  | `'use client'` | Server          | Only the sidebar context needs the client |
| `page.tsx`                    | `'use client'` | Server (async)  | Data fetching belongs on the server       |
| `dashboard-layout-client.tsx` | N/A            | `'use client'`  | Sidebar toggle context provider           |
| `dashboard-page-client.tsx`   | N/A            | `'use client'`  | Search/filter/sort state                  |
| `sidebar.tsx`                 | N/A (inline)   | `'use client'`  | Consumes sidebar context                  |
| `header.tsx`                  | N/A (inline)   | `'use client'`  | Consumes sidebar context                  |
| `summary-cards.tsx`           | `'use client'` | **Server**      | Pure display — no state, no events        |
| `filters.tsx`                 | `'use client'` | `'use client'`  | Needs onChange handlers                   |
| `product-table.tsx`           | `'use client'` | **Server**      | Pure display — no state, no events        |
| `web-vitals.tsx`              | `'use client'` | `'use client'`  | Needs useReportWebVitals hook             |
