# tasmeem

A simple, lightweight CSS framework authored in plain CSS and bundled with webpack.

## Project structure

```
src/
  index.js              webpack entry (imports the CSS)
  css/
    index.css           imports every partial in cascade order
    base/               tokens, semantic, component-tokens, themes, reset, typography
    layout/             container
    components/         button
demo/
  index.html            preview page for the built stylesheet
dist/                   build output (generated, gitignored)
```

## Getting started

```bash
npm install
```

## Build

```bash
npm run build       # production -> dist/tasmeem.min.css (minified)
npm run build:dev   # development -> dist/tasmeem.css (readable)
npm run watch       # rebuild on change
npm run serve       # dev server with the demo page
```

After building, open `demo/index.html` in a browser to preview.

## Usage

Drop the standalone file into a page:

```html
<link rel="stylesheet" href="tasmeem.min.css" />
```

Or, as an npm dependency, import the compiled CSS or individual source partials:

```css
@import "tasmeem";              /* dist/tasmeem.css */
@import "tasmeem/css/base/tokens.css";
```

## Customizing

The theme is built as a token pipeline, so the whole visual identity is driven
by a small seed of **base tokens**:

```
Base tokens  →  Semantic tokens  →  Component tokens  →  Components
(tokens.css)    (semantic.css)      (component-tokens.css)
```

- `base/tokens.css` — the ~11 knobs you edit to theme: `--brand-hue`,
  `--brand-saturation`, `--brand-lightness`, the matching `--surface-*` trio,
  the `--font-scale` / `--spacing-scale` / `--radius-scale` multipliers, and
  `--shadow-strength` / `--motion-scale`.
- `base/semantic.css` — colors, spacing, radius, type, motion and shadows
  **derived** from the base tokens with `hsl()` + `calc()`. Don't edit directly.
- `base/component-tokens.css` — per-component aliases (`--button-bg`,
  `--link-color`, `--focus-ring-color`, …) so components never reference raw
  colors.

Change one base token and everything downstream follows. For example, setting
`--brand-hue: 30` re-colors buttons, links, focus rings and outlines at once;
`--spacing-scale: 1.5` rescales all spacing.

### Light & dark themes

Dark mode is just a base-token override (see `base/themes.css`). It applies
automatically from the OS via `@media (prefers-color-scheme: dark)`, and can be
forced per page with a `data-theme` attribute:

```html
<html data-theme="dark"> … </html>   <!-- or data-theme="light" -->
```

`prefers-reduced-motion` is wired to `--motion-scale: 0`, which disables all
transitions. See `demo/index.html` for a working theme toggle.

## License

MIT
