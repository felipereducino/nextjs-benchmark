# Performance Benchmark: Server Components vs Client Components

## Branches

| Branch   | Pattern                         | Description                                                    |
| -------- | ------------------------------- | -------------------------------------------------------------- |
| `master` | **Test A** - All Client         | `layout.tsx` and `page.tsx` both use `'use client'`. Data fetched via `useEffect`. |
| `test-b` | **Test B** - Server + Wrappers  | `layout.tsx` and `page.tsx` are Server Components. Only interactive parts use `'use client'`. |

## What to compare

### 1. Bundle Analysis (most direct proof)

Run on each branch:

```bash
# Switch to branch
git checkout master   # or: git checkout test-b

# Build with analyzer
ANALYZE=true npx next build --webpack
```

This opens a browser with the bundle treemap. Compare:

- **Total client JS for /dashboard route**
- **Which modules appear in the client graph**
- **Whether server-only code leaked into the client bundle**

Save screenshots for comparison.

### 2. View Source / Initial HTML

Start each branch in production mode:

```bash
pnpm build && pnpm start
```

Open `http://localhost:3000/dashboard` and **View Page Source** (Ctrl+U).

| What to look for           | Test A (master)                       | Test B (test-b)                        |
| -------------------------- | ------------------------------------- | -------------------------------------- |
| Initial HTML content       | Loading spinner only                  | Full product table with 194 rows       |
| Data visible without JS    | No (needs useEffect)                  | Yes (server-rendered)                  |
| Script tags / JS chunks    | More, larger                          | Fewer, smaller                         |

This is the most visually convincing proof: **Test A shows a spinner, Test B shows data**.

### 3. Lighthouse (lab metrics)

For each branch in production mode (`pnpm build && pnpm start`):

1. Open Chrome DevTools → Lighthouse
2. Settings: **Mobile**, **Performance** category
3. Run **at least 5 times** on each branch
4. Record the **median** for:
   - Performance Score
   - LCP (Largest Contentful Paint)
   - TBT (Total Blocking Time)
   - CLS (Cumulative Layout Shift)

Expected results:
- Test B should have **better LCP** (content is in the HTML, not fetched after hydration)
- Test B should have **lower TBT** (less client JS to parse/execute)
- Test B should have **lower CLS** (no layout shift from spinner → table)

### 4. Web Vitals (console)

Both branches include a Web Vitals reporter. Open the browser console to see:

```
[Web Vital] LCP: 1200ms (good)
[Web Vital] INP: 45ms (good)
[Web Vital] CLS: 0.05 (good)
```

You can also access all collected metrics via:

```js
window.__WEB_VITALS
```

### 5. Network Tab Comparison

Open DevTools → Network tab. Hard refresh (Ctrl+Shift+R) on each branch.

Compare:
- **Total JS transferred** (filter by JS)
- **Number of JS chunks**
- **Waterfall pattern** (Test A will show: HTML → JS → API call → render. Test B: HTML with data → JS for interactivity only)

### 6. Performance Tab (Chrome DevTools)

Record a page load profile on each branch:

1. DevTools → Performance → Start recording → Refresh page → Stop
2. Compare:
   - **Main thread activity** (scripting, rendering, painting)
   - **Hydration time**
   - **Long Tasks** (yellow/red blocks on the main thread)

## Architecture Comparison

### Test A (master) - Anti-pattern

```
src/app/dashboard/
├── layout.tsx           ← 'use client' (sidebar state + context + sidebar + header ALL here)
├── page.tsx             ← 'use client' (useEffect fetch + all filter/sort state)
└── _components/
    ├── summary-cards.tsx  ← 'use client'
    ├── filters.tsx        ← 'use client'
    ├── product-table.tsx  ← 'use client'
    └── web-vitals.tsx     ← 'use client'
```

Problems:
- **layout.tsx is 100+ lines** mixing context, state, two components, and JSX
- **page.tsx fetches data with useEffect** → loading spinner → then data
- **Every component is a Client Component** even if it only displays data
- All imports get pulled into the client bundle

### Test B (test-b) - Best Practice

```
src/app/dashboard/
├── layout.tsx                  ← SERVER (composition only - 20 lines)
├── page.tsx                    ← SERVER + async (fetches data on server - 25 lines)
├── dashboard-page-client.tsx   ← 'use client' (only search/filter/sort state)
└── _components/
    ├── dashboard-layout-client.tsx ← 'use client' (only sidebar toggle context)
    ├── sidebar.tsx                 ← 'use client' (consumes sidebar context)
    ├── header.tsx                  ← 'use client' (consumes sidebar context)
    ├── summary-cards.tsx           ← SERVER (pure display, no state)
    ├── filters.tsx                 ← 'use client' (needs event handlers)
    ├── product-table.tsx           ← SERVER (pure display, no state)
    └── web-vitals.tsx              ← 'use client' (needs hook)
```

Gains:
- **layout.tsx is a thin server shell** (20 lines, clear composition)
- **page.tsx fetches data on the server** → HTML arrives with full content
- **summary-cards and product-table are Server Components** → zero client JS cost
- Only interactive components ship to the browser
- Cleaner file responsibilities

## Quick Start

```bash
# Test A
git checkout master
pnpm build && pnpm start
# Open http://localhost:3000/dashboard

# Test B
git checkout test-b
pnpm build && pnpm start
# Open http://localhost:3000/dashboard
```

## Expected Results Summary

| Metric                  | Test A (master)       | Test B (test-b)        | Why                                       |
| ----------------------- | --------------------- | ---------------------- | ----------------------------------------- |
| Client JS size          | Larger                | Smaller                | Server Components don't ship JS           |
| Initial HTML            | Loading spinner       | Full product table     | Server fetch vs useEffect                 |
| LCP                     | Slower                | Faster                 | Content in HTML vs loaded after hydration  |
| TBT                     | Higher                | Lower                  | Less JS to parse and execute              |
| CLS                     | Higher (spinner→data) | Lower (stable layout)  | No layout shift from async data load      |
| Hydration cost          | Full page             | Interactive parts only | Smaller client component tree             |
| Layout persistence      | Full client re-render | Server shell persists  | Layout stays server, only islands hydrate |
