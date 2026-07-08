const APPROX_LINE_HEIGHT = 15;
const APPROX_CHARS_PER_LINE = 42;
const HEADER_AND_CHROME_HEIGHT = 120;
const PAGE_CONTENT_HEIGHT = 750;

/**
 * Estimate whether a threat card fits within a single page's content area. A card that fits is
 * rendered atomically (wrap={false}) so it relocates whole to the next page instead of leaving a
 * header sliver at a page bottom; a taller card must wrap. The estimate is deliberately
 * conservative (20% margin) so a taller-than-page card is never wrongly kept atomic — that would
 * render degenerately in @react-pdf (#847).
 */
export const threatCardFitsOnOnePage = ({
    description,
    assets,
    measures,
}: {
    description: string | null | undefined;
    assets: readonly unknown[];
    measures: readonly { description?: string | null }[];
}): boolean => {
    const descriptionLines = Math.ceil((description?.length ?? 0) / APPROX_CHARS_PER_LINE);
    const informationLines = 8 + assets.length;
    // Count each measure's name line plus its description length, so a card with a few
    // long-described measures is not underestimated (which would wrongly mark it atomic).
    const measureLines = measures.reduce(
        (lines, measure) => lines + 1 + Math.ceil((measure.description?.length ?? 0) / APPROX_CHARS_PER_LINE),
        0
    );
    const estimatedCardHeight =
        HEADER_AND_CHROME_HEIGHT + (Math.max(descriptionLines, informationLines) + measureLines) * APPROX_LINE_HEIGHT;
    return estimatedCardHeight < PAGE_CONTENT_HEIGHT * 0.8;
};
