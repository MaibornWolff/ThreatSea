---
number: 5
title: Color design tokens
date: 2026-06-12
status: accepted
tags:
  - frontend
  - theming
---

# 5. Color design tokens

Date: 2026-06-12

## Status

Accepted

## Context

Color needs a single source of truth that separates raw values from design intent, so the palette can evolve without a wide refactor and theming stays consistent through MUI.

## Decision

Colors are defined in `/src/view/wrappers/color-tokens.ts` as a two-layer token model.

- **Primitives** (`colorPrimitives`) are raw rgba values named by hue and scale (e.g. `brand.blue900`, `neutral.gray100`). They are the single source of truth and are never imported by components.
- **Semantic aliases** (`colors`) are intent-based names (e.g. `text.default`, `surface.paper`, `border.focus`) that map onto primitives and are wired into the MUI palette in `theme.wrapper.tsx`.

Components consume color exclusively through the theme via `theme.vars.palette.*` with CSS variables enabled, so values resolve to CSS custom properties. Hardcoded color literals and direct token imports are disallowed and enforced by a `no-restricted-imports` lint rule.

A small, documented set of exceptions covers runtimes that cannot read CSS variables: the Konva editor canvas, which uses literal `theme.palette.*` values, and the `@react-pdf/renderer` report subtree, plus `theme.wrapper.tsx` itself.

Full reference: `apps/frontend/src/view/wrappers/THEME.md`.

## Consequences

Lint enforcement prevents drift back to hardcoded literals. Because CSS variables and `colorSchemes` are already enabled, future color-scheme and theming work is possible without restructuring.
