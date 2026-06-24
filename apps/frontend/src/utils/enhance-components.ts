import type { AugmentedSystemComponent } from "#api/types/system.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";

export type EnhancedComponent = AugmentedSystemComponent & {
    selected: boolean;
    startAnchor: unknown;
    symbol: string | null;
};

/**
 * Merges each system component with its standard symbol and a `selected` flag
 * for rendering on the canvas. The component's own `symbol` is overridden by the
 * matching standard component's symbol when one exists. Pure: it derives output
 * from input only and dispatches nothing.
 */
export const enhanceComponents = (
    components: AugmentedSystemComponent[],
    standardComponents: EditorComponentType[],
    selectedComponentId: string | null,
    startAnchor: unknown
): EnhancedComponent[] => {
    return components.map((c) => {
        // Find the standard component that matches the type of c.
        const standardComponent = standardComponents.find((sc) => sc.id === c.type);

        return {
            ...c,
            selected: selectedComponentId === c.id,
            startAnchor,
            // Set the symbol based on the matching standard component.
            symbol: standardComponent ? standardComponent.symbol : c.symbol,
        };
    });
};
