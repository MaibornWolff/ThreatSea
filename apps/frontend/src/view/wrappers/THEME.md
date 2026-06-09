# Theming

The app theme is a thin layer over MUI. Design decisions live in token files, get mapped into the MUI theme in [`theme.wrapper.tsx`](./theme.wrapper.tsx), and reach components via `theme.palette.*` (with `cssVariables: true` enabled, so values are emitted as CSS custom properties). Custom palette slots are declared in [`src/types/mui-theme.d.ts`](../../types/mui-theme.d.ts).

## Colors

### Token model

Defined in [`color-tokens.ts`](./color-tokens.ts) as two layers:

1. **Primitives** (`colorPrimitives`) — raw `rgba()` values named by hue and scale (`brand.blue900`, `neutral.gray100`). Single source of truth; never imported by components.
2. **Semantic aliases** (`colors`) — intent-based names mapped to primitives (`text.default`, `surface.paper`, `border.focus`). Wired into the MUI palette and consumed from there.

Two aliases may resolve to the same primitive on purpose (e.g. `surface.paperWhite` vs `surface.canvasFill`). Keeping them distinct preserves intent so a later design change can diverge them without a wide refactor.

### Consuming

Always read from `theme.palette`. Never import tokens directly into a component — the palette indirection is what makes future theme variants possible without touching components.

```tsx
sx={{ color: theme.palette.text.primary, bgcolor: theme.palette.background.paper }}
```

### Adding a color

1. If a semantic alias already fits, just use it.
2. Otherwise add a primitive in `colorPrimitives` (reuse if the value exists).
3. Add a semantic alias in `colors` named by intent, not appearance.
4. Wire it into the palette in `theme.wrapper.tsx`.
5. Augment palette types in `src/types/mui-theme.d.ts` if the slot is new.

### Conventions & gotchas

- All values are `rgba(r, g, b, a)`. Translucent and opaque variants are separate primitives.
- `text.primary`, `text.secondary`, and `primary.main` currently resolve to the same brand blue — don't rely on them differing visually for active/inactive states.
- PDF-rendering quirk primitives (e.g. `blue900Pdf`) stay separate from their on-screen counterparts even when values nearly match.
