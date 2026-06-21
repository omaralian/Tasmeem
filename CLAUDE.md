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

There is **no test runner and no linter configured**. `npm run build:dev` is the validation step — it fails on unresolved `@import` paths but does **not** validate CSS property values (a bad `calc()`/`hsl()` is silently ignored by the browser, not by the build). Verify visual/derivation changes by building then opening the demo pages (`demo/index.html`, `demo/buttons.html`) or running `npm run serve`.

## Architecture

### Build wiring
`src/css/index.css` is the single source of truth: it `@import`s every partial in cascade order. **Order matters** and is the contract — token tiers must load before the rules that consume them, and theme overrides must load after the base tokens they override. When adding a partial, insert the `@import` at the right point in `index.css`.

`demo/index.html` links `../dist/tasmeem.css`, so you must build before the demo reflects source changes.

### Token-driven design system (the core concept)
The entire visual identity is derived from a small seed of base tokens through a layered
pipeline that keeps **color generation, semantic meaning, component behavior, and component
implementation isolated** from each other:

```
Base tokens     Color generation     Semantic roles          Component tokens       Components
tokens.css  ->  color-recipe.css ->  intents.css         ->  component-tokens.css -> components/*
(OKLCH seeds)   (one intent recipe)  semantic.css            (per-component         (own their
                                     (intent seeds +          aliases)               states)
                                      neutral default;
                                      + surfaces, accent,
                                      scales)
```

Color names describe **visual roles, not interaction states** — the recipe never knows what
"hover" means; components do. The generation step is written **once** and reused by every intent,
so there is no per-intent duplication.

- **Base tokens** (`tokens.css`): a dozen knobs — `--primary-{h,c,l}`, `--surface-{h,c,l}` (OKLCH channels: hue 0–360, chroma 0–~0.4, lightness 0–1 **unitless**), the `--{success,warning,danger,info}-h` status hues, `--contrast-threshold`, the `--font-scale` / `--spacing-scale` / `--radius-scale` multipliers, and `--shadow-strength` / `--motion-scale`. **This is the only file you normally edit to theme.**
- **Color recipe** (`color-recipe.css`): the framework's single **color-generation** step. Given an intent's OKLCH **seed** (`--_h/--_c/--_l`, set per intent in `intents.css`), one grouped rule derives the whole **role family** — `--intent-color`, `--intent-emphasis` (L − 0.06), `--intent-strong` (L − 0.12), `--intent-on-color`, the `--intent-subtle`/`-muted`/`-muted-strong` soft-tint ramp (alpha steps), `--intent-on-subtle`, `--intent-border`, `--intent-ring` — with native `oklch()` + `calc()`. It is written **once** and applied to every colored intent at the same time (`.primary, .success, …`), so there is **no per-intent duplication**, and the role names describe **visual roles, not interaction states**. It re-resolves per element because each element carries its intent class (which sets the seed), so the recipe rule matches it and computes the family from *that* element's seed.
  - **Auto-contrast engine.** Because OKLCH lightness is perceptual, the readable foreground for any background is a sharp `clamp()` switch on its L against `--contrast-threshold` — no per-hue bias: `--_on-l: clamp(0.15, calc((var(--contrast-threshold) - <bg L>) * 100), 0.98); …: oklch(var(--_on-l) 0 0);`. The `* 100` saturates the result to near-black (0.15) on light fills or near-white (0.98) on dark ones. The recipe uses it for every `--intent-on-color`; `semantic.css` reuses the same pattern for `--color-text`/`--color-muted` on neutral surfaces. The seed lightnesses (status L = an offset from `--primary-l`, e.g. amber/info sit high → dark text; primary/danger sit lower → light text) are tuned so every `.btn` intent clears WCAG AA in rest/hover/active.
- **Semantic tokens** (`semantic.css`): the **non-intent** semantics — the neutral **surfaces** (`--color-bg/-surface/-border/-text/-muted`, derived from `--surface-*` via the contrast engine, so surface text auto-inverts in dark mode), the single page **accent** (`--color-accent`/`-emphasis`: the primary color for links and the focus-ring fallback — one color, not a per-intent palette), and the spacing / radius / type / motion / shadow scales. The per-intent color families are **not** here; they come from the recipe.
- **Intent roles** (`intents.css`): the **semantic-meaning** layer (formerly `variants.css`). An **intent** (`primary`, `success`, `warning`, `danger`, `info`, plus `neutral`) is a class. Colored intents declare **only** their OKLCH seed (`.primary { --_h/--_c/--_l }`); the recipe turns each seed into the `--intent-*` family on that element. A class carries **no** component CSS, so the same `.primary`/`.danger`/… recolor buttons, badges, alerts, nav, and any future component uniformly. **Add an intent** by adding its class to the recipe's selector group + a one-line seed here — no component changes.
  - **Neutral is the default foundation.** The `:root` block seeds the full `--intent-*` family with the neutral (surface-derived) palette, so a component with **no** intent class is fully styled; an intent class simply overrides the roles on the element. Neutral is defined **explicitly** (not via the recipe) because it steps along the surface scale (surface → border → muted) rather than darkening a saturated hue. Usage: `class="btn primary"`, `class="btn danger outline"` — the bare `btn` is neutral.
- **Component tokens** (`component-tokens.css`): per-component **layout** aliases (`--button-padding-*`, `--button-radius`, `--link-color`, `--focus-ring-color`, …). Component *color* flows through the `--intent-*` role tokens, not through per-component color aliases.
- **Components own their states.** A *style* (`solid` default, `outline`, `ghost`, `subtle`) is the only per-component color code. The component maps interaction **states** onto the role family itself — e.g. `button.css` declares `--button-bg: var(--intent-color); --button-bg-hover: var(--intent-emphasis); --button-bg-active: var(--intent-strong)` at the top of `.btn`, and the ghost/subtle styles walk the soft ramp (`--intent-subtle` → `-muted` → `-muted-strong`) so hover and active stay distinct. The color layer never names hover/active. Styles are **additive** (one set of rules each, not one per intent×style), so they compose with every intent: `.btn.danger.outline`, `.btn.success.ghost`, `.btn.info.subtle`. New components follow the same pattern — read `--intent-*`, map your own states.
  - **Why role tokens are read directly (not via a `:root` component alias).** A `var()` inside a custom property declared at `:root` is substituted with `:root`'s value and then *inherited already-resolved*; it will **not** re-resolve when an intent class sets `--intent-*` on the element. So components consume `--intent-*` directly, or alias inside their **own rule block** (e.g. `--button-bg` is declared inside `.btn`, where it re-resolves per element). Don't reintroduce a `:root`-level `--button-bg: var(--intent-color)` indirection — it silently breaks per-element intents.

### Rules to preserve when editing
- **Components must consume tokens, never raw values.** No hex/`rgb()`/literal colors, durations, or border widths in `components/`, `layout/`, or `typography.css` — read an `--intent-*` role token for color (mapping it to your own states), or a component/semantic token otherwise. Add a new component token in `component-tokens.css` rather than hardcoding.
- **Add new intents by seeding them**, not by hardcoding hex or duplicating the recipe. Add the intent class to the grouped selector in `color-recipe.css` and a one-line OKLCH seed (`--_h/--_c/--_l`) in `intents.css`; the recipe derives the whole `--intent-*` family (foreground included, via the auto-contrast switch). Never hand-write a per-intent color block.
- **Theming = overriding base tokens only.** Dark mode lives in `themes.css` and re-declares only base tokens; everything downstream recomputes via `var()` resolution. Dark mode flips only the surface (`--surface-l`/`--surface-c`) and `--shadow-strength` — `--primary-l` is deliberately left at its base value, because the colored fills are self-contained and already pass contrast, so changing them would only cost button-label AA. It applies both automatically (`@media (prefers-color-scheme: dark)`) and manually (`[data-theme="dark"|"light"]` on `<html>`). `prefers-reduced-motion` is wired to `--motion-scale: 0`. The dark values are intentionally duplicated between the attribute rule and the media query (plain CSS can't share a block).
- `--_`-prefixed custom properties are private helpers: `--_on-surface-l` and `--_shadow-channels` in `semantic.css`, the `--_on-l` contrast switch in `color-recipe.css`, and the `--_h/--_c/--_l` intent seeds set in `intents.css` (consumed only by the recipe).
- Several token names are kept as backward-compatible aliases (e.g. `--radius` → `--radius-md`, plus `--space-sm/md/lg`, `--container-max`). Preserve these names and their default values.
- **Intent role tokens are the public color contract** — `--intent-color`, `--intent-on-color`, `--intent-subtle`/`-muted`/`-muted-strong`, `--intent-on-subtle`, `--intent-emphasis`, `--intent-strong`, `--intent-border`, `--intent-ring`. (This redesign renamed the former `--variant-*` tokens to `--intent-*` and removed the global per-intent `--color-{intent}*` palettes / state-named `--color-*-hover`/`-active`; the page accent for non-intent chrome is now `--color-accent`/`-emphasis`.) Token-level rendering is unchanged from before the rename; the **one intentional exception** (pre-existing) is that a bare `.btn` (no intent) is the **neutral** palette rather than primary — adding `.primary` restores the primary button. Intent and style are composable classes (`.btn primary outline`); the disabled state on non-form elements uses `.disabled`.

### Publishing
`package.json` ships `dist/` and `src/css/`. `exports` maps `./css/*` → `./src/css/*`, so consumers can import individual source partials (e.g. `tasmeem/css/base/tokens.css`); keep that path stable when renaming files.

## Known limitation
Color values are OKLCH. `oklch()` is supported in all major browsers since 2023 (Chrome/Edge 111, Safari 15.4, Firefox 113); there is no HSL fallback by default (add an `@supports not (color: oklch(0 0 0))` block if pre-2023 browsers matter). Keep base/status chroma moderate (`--primary-c` is `0.13`): very high chroma at some hue/lightness combinations falls outside sRGB and the browser gamut-maps it, which can shift the rendered color. The contrast engine reads each color's OKLCH lightness, so a foreground only stays readable if the background's `--*-l` (and the `--contrast-threshold` split, default `0.65`) are set sensibly. Links reuse `--color-accent` (the primary color) as a foreground on the page background, which is the one place the engine doesn't govern: on a dark surface that lands near 3.8:1 (AA for large text, not normal). Give `--link-color` its own lighter derivation if you need 4.5:1.
