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

- **Base tokens** (`tokens.css`): a dozen knobs — `--brand-{h,c,l}`, `--surface-{h,c,l}` (OKLCH channels: hue 0–360, chroma 0–~0.4, lightness 0–1 **unitless**), the `--{success,warning,danger,info}-h` status hues, `--contrast-threshold`, the `--font-scale` / `--spacing-scale` / `--radius-scale` multipliers, and `--shadow-strength` / `--motion-scale`. **This is the only file you normally edit to theme.**
- **Semantic tokens** (`semantic.css`): colors, spacing, radius, type, motion, shadows **derived** from base tokens with native `oklch()` + `calc()`. Colors are stored as OKLCH channels so variants come from `calc()` on lightness/chroma (e.g. hover = lightness − 0.06). Every foreground is computed by the **auto-contrast engine** (see below), not hardcoded; surface text auto-inverts because it keys off `--surface-l`.
  - **Auto-contrast engine.** Because OKLCH lightness is perceptual, the readable foreground for any background is a sharp `clamp()` switch on its L against `--contrast-threshold` — no per-hue bias. The reusable 2-line pattern per color is `--_on-<x>-l: clamp(0.15, calc((var(--contrast-threshold) - <bg L>) * 100), 0.98); --color-on-<x>: oklch(var(--_on-<x>-l) 0 0);`. It drives every `--color-on-*` (text on colored fills) **and** `--color-text`/`--color-muted` (text on neutral surfaces). Status fills get a real perceptual L via an offset from `--brand-l` (`--success-l`, `--warning-l`, …); that real L is what the engine reads, so each foreground is picked correctly with no per-color overrides — the brighter fills (success/warning/info) take dark text, the deeper ones (primary/danger) take light text. The base lightnesses are tuned so every `.btn` variant clears WCAG AA in default/hover/active states.
- **Component tokens** (`component-tokens.css`): per-component aliases (`--button-bg`, `--link-color`, `--focus-ring-color`, …).

### Rules to preserve when editing
- **Components must consume tokens, never raw values.** No hex/`rgb()`/literal colors, durations, or border widths in `components/`, `layout/`, or `typography.css` — reference a component token (preferred) or semantic token. Add a new component token in `component-tokens.css` rather than hardcoding.
- **Add new color variants by deriving them**, not by hardcoding hex. Follow the `oklch(var(--brand-…) calc(…))` pattern in `semantic.css`, and derive any new foreground with the auto-contrast pattern above rather than guessing a text color.
- **Theming = overriding base tokens only.** Dark mode lives in `themes.css` and re-declares only base tokens; everything downstream recomputes via `var()` resolution. Dark mode flips only the surface (`--surface-l`/`--surface-c`) and `--shadow-strength` — `--brand-l` is deliberately left at its base value, because the colored fills are self-contained and already pass contrast, so changing them would only cost button-label AA. It applies both automatically (`@media (prefers-color-scheme: dark)`) and manually (`[data-theme="dark"|"light"]` on `<html>`). `prefers-reduced-motion` is wired to `--motion-scale: 0`. The dark values are intentionally duplicated between the attribute rule and the media query (plain CSS can't share a block).
- `--_`-prefixed custom properties (e.g. `--_on-surface-l`, the `--_on-<x>-l` contrast switches, `--_shadow-channels`) are private helpers internal to `semantic.css`.
- Several token names are kept as backward-compatible aliases (e.g. `--radius` → `--radius-md`, plus `--space-sm/md/lg`, `--color-primary`, `--container-max`). Preserve these names and their default values; default rendering should stay visually unchanged.

### Publishing
`package.json` ships `dist/` and `src/css/`. `exports` maps `./css/*` → `./src/css/*`, so consumers can import individual source partials (e.g. `tasmeem/css/base/tokens.css`); keep that path stable when renaming files.

## Known limitation
Color values are OKLCH. `oklch()` is supported in all major browsers since 2023 (Chrome/Edge 111, Safari 15.4, Firefox 113); there is no HSL fallback by default (add an `@supports not (color: oklch(0 0 0))` block if pre-2023 browsers matter). Keep base/status chroma moderate (`--brand-c` is `0.13`): very high chroma at some hue/lightness combinations falls outside sRGB and the browser gamut-maps it, which can shift the rendered color. The contrast engine reads each color's OKLCH lightness, so a foreground only stays readable if the background's `--*-l` (and the `--contrast-threshold` split, default `0.65`) are set sensibly. Links reuse `--color-primary` as a foreground on the page background, which is the one place the engine doesn't govern: on a dark surface that lands near 3.8:1 (AA for large text, not normal). Give `--link-color` its own lighter derivation if you need 4.5:1.
