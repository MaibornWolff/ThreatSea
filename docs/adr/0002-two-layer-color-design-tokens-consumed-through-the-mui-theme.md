---
number: 2
title: Two-layer color design tokens consumed through the MUI theme
date: 2026-06-12
status: accepted
tags:
  - frontend
  - theming
---

# 2. Two-layer color design tokens consumed through the MUI theme

Date: 2026-06-12

## Status

Accepted

## Context

Color needs a single source of truth that separates raw values from design intent, so the palette can change without touching every component and theming stays consistent.

## Decision

Colors are defined as two token layers in `apps/frontend/src/view/wrappers/color-tokens.ts`: raw primitives, and semantic aliases that map onto them and feed the MUI palette. Components consume color only through the theme (`theme.vars.palette.*`, with CSS variables enabled). Direct token imports are blocked by a `no-restricted-imports` lint rule; hardcoded color literals are avoided by convention. `theme.wrapper.tsx`, which wires the tokens into the palette, and runtimes that cannot read CSS variables (the Konva canvas and the PDF report) are documented exceptions.

Details and how to add a color: `apps/frontend/src/view/wrappers/THEME.md`.

## Consequences

Reversing this would touch every component that uses color. Because CSS variables and `colorSchemes` are already enabled, additional color schemes can be added without restructuring.
