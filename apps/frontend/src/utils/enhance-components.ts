import type { AugmentedSystemComponent } from "#api/types/system.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";

export type EnhancedComponent = AugmentedSystemComponent & {
    selected: boolean;
    startAnchor: unknown;
    symbol: string | null;
};

/**
 * Adds a `selected` flag and the symbol (icon) to render on the canvas. The per-instance `symbol`
 * wins; the standard component type's symbol is a fallback when the instance has none. Pure.
 */
export const enhanceComponents = (
    components: AugmentedSystemComponent[],
    standardComponents: EditorComponentType[],
    selectedComponentId: string | null,
    startAnchor: unknown
): EnhancedComponent[] => {
    return components.map((component) => {
        const standardComponentType = standardComponents.find((candidate) => candidate.id === component.type);

        return {
            ...component,
            selected: selectedComponentId === component.id,
            startAnchor,
            // Per-instance icon wins; fall back to the type's symbol.
            symbol: component.symbol ?? standardComponentType?.symbol ?? null,
        };
    });
};
