# Task 2 report: single-owner table and code frames

## Changes

- Moved table spacing, Slate ring, radius, clipping, and horizontal overflow to
  `.table-scroll`.
- Restored `.table-scroll > table` to native table layout with
  `width: max-content` and `min-width: 100%`, while resetting its frame styles.
- Kept header and cell separators and removed the final body-row separator.
- Made the Expressive Code `figure` the only framed, clipping element; its `pre`
  keeps horizontal scrolling but resets border, radius, and shadow.
- Replaced the prior coarse table/code assertions with strict ownership checks.

## TDD evidence

### RED

Command:

```text
npm run test:typesetting
```

Result: exited 1 with the expected assertion failure:

```text
AssertionError: the table wrapper must own spacing, frame, clipping, and horizontal scrolling
```

The old CSS still used `table { display: block; overflow-x: auto; }` and had no
`.table-scroll` owner, so the new constraint correctly failed before production
CSS changed.

### GREEN

Commands:

```text
npm run test:typesetting
npm run tsc
npm run build
git diff --check
```

Results:

```text
typesetting migration constraints passed
tsc --noEmit: exit 0
astro build: exit 0 (0 errors, 0 warnings, 3 pre-existing Astro hints)
git diff --check: exit 0
```

The built CSS was also inspected: `.table-scroll` compiles to a single
ring/radius/horizontal-scroll frame and `pre` compiles without a border,
radius, or shadow.

## Self-review and concerns

- The wrapper markup is supplied by Task 1 and is intentionally not modified.
- `overflow: hidden` plus `overflow-x: auto` compiles to horizontal scrolling
  with vertical clipping (`overflow: auto hidden`), preserving the requested
  outer clipping without making the native table itself a scroll container.
- The build completes with three existing `astro(4000)` inline-script hints in
  JSON-LD/theme components; they are unrelated to this task.

## Commit

`fix: give tables and code blocks one frame`
