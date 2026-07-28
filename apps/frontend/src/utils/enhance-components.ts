import type { AugmentedSystemComponent } from "#api/types/system.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";

export type EnhancedComponent = AugmentedSystemComponent & {
    selected: boolean;
    startAnchor: unknown;
    symbol: string | null;
};

/**
 * Merges each system component with a `selected` flag and the symbol (icon) to render on the canvas.
 * The component's own per-instance `symbol` takes precedence; the matching standard component type's
 * symbol is used only as a fallback when the instance has none. Pure: it derives output from input
 * only and dispatches nothing.
 */
export const enhanceComponents = (
    components: AugmentedSystemComponent[],
    standardComponents: EditorComponentType[],
    selectedComponentId: string | null,
    startAnchor: unknown
): EnhancedComponent[] => {
    return components.map((component) => {
        // Find the standard component type whose id matches this component's type.
        const standardComponentType = standardComponents.find((candidate) => candidate.id === component.type);

        return {
            ...component,
            selected: selectedComponentId === component.id,
            startAnchor,
            // Per-instance icon wins; fall back to the standard component type's symbol only when unset.
            symbol: component.symbol ?? standardComponentType?.symbol ?? null,
        };
    });
};
