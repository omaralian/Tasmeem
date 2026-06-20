# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

tasmeem is a small CSS framework authored in **plain CSS** (no Sass/PostCSS) and bundled with webpack. There is no application runtime — `src/index.js` exists only to `import './css/index.css'` so webpack can extract a stylesheet. The emitted JS bundle (`dist/.tasmeem.bundle.js`) is throwaway; the real artifact is the CSS.

## Commands

```bash
npm install
npm run build:dev   # dev build -> dist/tasmeem.css (readable)
npm run build       # prod build -> dist/tasmeem.min.css (minified)
npm run watch       # rebuild on change
npm run serve       # dev server at http://localhost:8080 (serves demo/ + dist/)
```

There is **no test runner and no linter configured**. `npm run build:dev` is the validation step — it fails on unresolved `@import` paths but does **not** validate CSS property values (a bad `calc()`/`hsl()` is silently ignored by the browser, not by the build). Verify visual/derivation changes by building then opening `demo/index.html` (or `npm run serve`).

## Architecture

### Build wiring
`src/css/index.css` is the single source of truth: it `@import`s every partial in cascade order. **Order matters** and is the contract — token tiers must load before the rules that consume them, and theme overrides must load after the base tokens they override. When adding a partial, insert the `@import` at the right point in `index.css`.

`demo/index.html` links `../dist/tasmeem.css`, so you must build before the demo reflects source changes.

### Token-driven design system (the core concept)
The entire visual identity is derived from a small seed of base tokens through a 3-tier pipeline:

```
Base tokens            -> Semantic tokens        -> Component tokens          -> Components
src/css/base/tokens.css   src/css/base/semantic.css  src/css/base/component-tokens.css   src/css/components/*, etc.
```

- **Base tokens** (`tokens.css`): ~11 knobs — `--brand-{hue,saturation,lightness}`, `--surface-{hue,saturation,lightness}`, the `--font-scale` / `--spacing-scale` / `--radius-scale` multipliers, and `--shadow-strength` / `--motion-scale`. **This is the only file you normally edit to theme.**
- **Semantic tokens** (`semantic.css`): colors, spacing, radius, type, motion, shadows **derived** from base tokens with native `hsl()` + `calc()`. Colors are stored as HSL channels so variants come from `calc()` on lightness/saturation (e.g. hover = lightness − 8%). Surface-based tokens (text/muted/border) auto-invert because they derive from `--surface-lightness`.
- **Component tokens** (`component-tokens.css`): per-component aliases (`--button-bg`, `--link-color`, `--focus-ring-color`, …).

### Rules to preserve when editing
- **Components must consume tokens, never raw values.** No hex/`rgb()`/literal colors, durations, or border widths in `components/`, `layout/`, or `typography.css` — reference a component token (preferred) or semantic token. Add a new component token in `component-tokens.css` rather than hardcoding.
- **Add new color variants by deriving them**, not by hardcoding hex. Follow the `hsl(var(--brand-…) calc(…))` pattern in `semantic.css`.
- **Theming = overriding base tokens only.** Dark mode lives in `themes.css` and re-declares only base tokens; everything downstream recomputes via `var()` resolution. It applies both automatically (`@media (prefers-color-scheme: dark)`) and manually (`[data-theme="dark"|"light"]` on `<html>`). `prefers-reduced-motion` is wired to `--motion-scale: 0`. The dark values are intentionally duplicated between the attribute rule and the media query (plain CSS can't share a block).
- `--_`-prefixed custom properties (e.g. `--_text-lightness`, `--_shadow-channels`) are private helpers internal to `semantic.css`.
- Several token names are kept as backward-compatible aliases (e.g. `--radius` → `--radius-md`, plus `--space-sm/md/lg`, `--color-primary`, `--container-max`). Preserve these names and their default values; default rendering should stay visually unchanged.

### Publishing
`package.json` ships `dist/` and `src/css/`. `exports` maps `./css/*` → `./src/css/*`, so consumers can import individual source partials (e.g. `tasmeem/css/base/tokens.css`); keep that path stable when renaming files.

## Known limitation
The auto-contrast text math in `semantic.css` assumes light/dark `--surface-lightness` values in safe ranges; mid-range values (~45–60%) yield low text contrast. `--color-on-primary` assumes a mid/dark brand.
