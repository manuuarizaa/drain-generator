# Drain Generator

Drain Generator is a browser-based parametric drain configurator. It lets
users customize a drain cover, inspect the result in an interactive 3D preview,
and export the generated model as a binary STL file for fabrication or 3D
printing.

## Features

- Real-time WebGL preview powered by Three.js.
- Adjustable size, height, corner radius, border, and opening count.
- Square, rounded, and circular opening patterns.
- Mouse and touch controls for rotating and zooming the model.
- Binary STL generation and download directly in the browser.
- Spanish and English interfaces with automatic browser-language detection.
- Persisted language preference.
- Responsive layout for desktop and mobile devices.

## Technology

- React
- TypeScript
- Vite
- Three.js
- Earcut
- Vitest
- pnpm

## Getting Started

### Requirements

- Node.js
- pnpm 10 or later

### Installation

```bash
pnpm install
```

### Development

Start the local development server:

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

## Validation

Run type checking, tests, and the production build:

```bash
pnpm validate
```

The individual commands are also available:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## How It Works

The control panel updates a shared drain configuration. That configuration is
used to rebuild the Three.js geometry shown in the viewport. When the user
downloads the model, the same parameters are converted into a watertight
triangle mesh and encoded as a binary STL file entirely in the browser.
