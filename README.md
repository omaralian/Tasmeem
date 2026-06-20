# tasmeem

A simple, lightweight CSS framework authored in plain CSS and bundled with webpack.

## Project structure

```
src/
  index.js              webpack entry (imports the CSS)
  css/
    index.css           imports every partial in cascade order
    base/               variables, reset, typography
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
@import "tasmeem/css/base/variables.css";
```

## Customizing

Override the design tokens in `src/css/base/variables.css` (the `:root` custom
properties) to theme colors, spacing, typography, and layout.

## License

MIT
