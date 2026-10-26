/**
 * @module render-pdf-tree - Renders `@react-pdf/renderer` components for component tests.
 *
 * react-pdf primitives (`View`, `Text`, `Page`, …) are plain strings such as "VIEW" that only
 * react-pdf's own reconciler understands; react-dom cannot render them meaningfully. This helper
 * mounts the element through `createRenderer` — the same reconciler `pdf()` uses before layout —
 * and returns the resulting node tree. No fonts are loaded and no PDF is laid out, so tests stay
 * fast and need no `vi.mock` of react-pdf.
 *
 * Usage:
 *   const tree = await renderPdfTree(<Text size="small">Hello</Text>);
 *   expect(getTexts(tree)).toEqual(["Hello"]);
 */
import { act, type ReactElement } from "react";
import * as reactPdf from "@react-pdf/renderer";
import { Translations } from "#view/wrappers/translations.wrapper.tsx";

export interface PdfNode {
    type: string;
    style?: Record<string, unknown> | Record<string, unknown>[];
    props: Record<string, unknown>;
    children: PdfNode[];
    value?: string;
}

interface PdfContainer {
    type: "ROOT";
    document: PdfNode | null;
}

interface PdfReconciler {
    createContainer: (container: PdfContainer) => unknown;
    updateContainer: (element: ReactElement | null, mountNode: unknown, parent: null, callback: () => void) => void;
}

// `createRenderer` is exported at runtime but missing from react-pdf's type declarations.
const { createRenderer } = reactPdf as unknown as { createRenderer: (options: object) => PdfReconciler };
const reconciler = createRenderer({});

type ActEnvironment = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

/**
 * Renders a react-pdf element tree inside the app's i18next provider and resolves with the root
 * node once the reconciler has committed it.
 */
export const renderPdfTree = async (element: ReactElement): Promise<PdfNode> => {
    const container: PdfContainer = { type: "ROOT", document: null };
    const mountNode = reconciler.createContainer(container);
    // Testing Library only flags the act environment while its own helpers run; this reconciler
    // needs it set too, or React warns that act() is unsupported.
    const actEnvironment = globalThis as ActEnvironment;
    const previousActEnvironment = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    try {
        await act(async () => {
            await new Promise<void>((resolve) => {
                reconciler.updateContainer(<Translations>{element}</Translations>, mountNode, null, resolve);
            });
        });
    } finally {
        if (previousActEnvironment === undefined) {
            delete actEnvironment.IS_REACT_ACT_ENVIRONMENT;
        } else {
            actEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
        }
    }
    if (!container.document) {
        throw new Error("renderPdfTree: the element rendered nothing");
    }
    return container.document;
};

/** All nodes of the given react-pdf type ("VIEW", "TEXT", "LINK", "IMAGE", "PAGE", …), depth first. */
export const findAllByType = (node: PdfNode, type: string): PdfNode[] => {
    const ownMatch = node.type === type ? [node] : [];
    return [...ownMatch, ...(node.children ?? []).flatMap((child) => findAllByType(child, type))];
};

const collectTextInstances = (node: PdfNode): string =>
    node.type === "TEXT_INSTANCE" ? (node.value ?? "") : (node.children ?? []).map(collectTextInstances).join("");

/** The visible string of every `Text` node, in document order. */
export const getTexts = (node: PdfNode): string[] => findAllByType(node, "TEXT").map(collectTextInstances);

/** The visible string of a single node and everything below it. */
export const getText = (node: PdfNode): string => collectTextInstances(node);

/**
 * Invokes every `render` prop in the tree the way react-pdf does during pagination, and returns
 * the nodes they produce. Use it to exercise page-number dependent output such as the table of
 * contents callback or the footer page number.
 */
export const runRenderProps = (
    node: PdfNode,
    pageProps: { pageNumber: number; totalPages: number } = { pageNumber: 1, totalPages: 1 }
): PdfNode[] => {
    const render = node.props?.["render"] as ((props: typeof pageProps) => PdfNode[]) | undefined;
    const ownResult = render ? render(pageProps) : [];
    return [...ownResult, ...(node.children ?? []).flatMap((child) => runRenderProps(child, pageProps))];
};
