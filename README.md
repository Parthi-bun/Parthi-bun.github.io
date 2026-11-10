# Parthiban Ilango

Source for [parthi-bun.github.io](https://parthi-bun.github.io/).

A single self-contained page with no framework. The animated background is a WebGL fragment shader, and each project has a small working model written in plain JavaScript.

## Build

```bash
node build.mjs
```

This inlines `src/` into `docs/index.html` and copies the images to `docs/img/`. GitHub Pages serves the `docs/` folder.

## Layout

- `src/index.html`: page text and links
- `src/styles.css`: styles and colours
- `src/img/`: screenshots and the link-preview image
- `src/js/10-field.js`: background shaders
- `src/js/40-toys-a.js`, `41-toys-b.js`, `42-toys-c.js`: working models
