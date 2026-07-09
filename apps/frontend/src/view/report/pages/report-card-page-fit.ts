// Decides whether a report card is rendered atomically (wrap={false} → react-pdf moves the
// whole card to the next page when the remaining space is too small — no header sliver at a
// page bottom) or stays wrappable (splits across pages).

const LINE_HEIGHT = 15;
// title Text has maxWidth 250 and a semibold face
const TITLE_CHARS_PER_LINE = 26;
// half-width columns: description, informations, assets, measure descriptions (indented italic)
const COLUMN_CHARS_PER_LINE = 32;
// full-width texts: measure/component names, asset descriptions
const FULL_WIDTH_CHARS_PER_LINE = 55;
const CARD_CHROME_HEIGHT = 60;
const PAGE_CONTENT_HEIGHT = 754;
const ATOMIC_LIMIT = PAGE_CONTENT_HEIGHT * 0.75;

const textLines = (text: string | null | undefined, charsPerLine: number): number =>
    text ? Math.ceil(text.length / charsPerLine) : 0;

interface ThreatCardShape {
    name: string | null | undefined;
    description: string | null | undefined;
    assets: readonly { name?: string | null | undefined }[];
    measures: readonly { name?: string | null | undefined; description?: string | null | undefined }[];
}

export const threatCardFitsOnOnePage = ({ name, description, assets, measures }: ThreatCardShape): boolean => {
    // header row: title (narrow, wrapping) + id + CIA labels, at least as tall as the risk matrix
    const headerLines = Math.max(textLines(name, TITLE_CHARS_PER_LINE) + 3, 8);
    // two-column body: informations (component/attacker/point of attack + assets) beside description
    const informationLines = 8 + assets.reduce((sum, asset) => sum + textLines(asset.name, COLUMN_CHARS_PER_LINE), 0);
    const descriptionLines = textLines(description, COLUMN_CHARS_PER_LINE);
    const bodyLines = Math.max(informationLines, descriptionLines);
    // measures: section title, then per measure its full-width name, indented description and spacing
    const measureLines =
        (measures.length > 0 ? 1 : 0) +
        measures.reduce(
            (sum, measure) =>
                sum +
                1 +
                textLines(measure.name, FULL_WIDTH_CHARS_PER_LINE) +
                textLines(measure.description, COLUMN_CHARS_PER_LINE),
            0
        );
    const estimatedHeight = CARD_CHROME_HEIGHT + (headerLines + bodyLines + measureLines) * LINE_HEIGHT;
    return estimatedHeight < ATOMIC_LIMIT;
};

interface AssetCardShape {
    name: string | null | undefined;
    description: string | null | undefined;
    confidentialityJustification?: string | null | undefined;
    integrityJustification?: string | null | undefined;
    availabilityJustification?: string | null | undefined;
}

export const assetCardFitsOnOnePage = ({
    name,
    description,
    confidentialityJustification,
    integrityJustification,
    availabilityJustification,
}: AssetCardShape): boolean => {
    const headerLines = textLines(name, FULL_WIDTH_CHARS_PER_LINE) + 3;
    const descriptionLines = textLines(description, COLUMN_CHARS_PER_LINE) + 1;
    const justificationLines = [confidentialityJustification, integrityJustification, availabilityJustification].reduce(
        (sum, justification) => sum + (justification ? 1 + textLines(justification, COLUMN_CHARS_PER_LINE) : 0),
        0
    );
    const estimatedHeight = CARD_CHROME_HEIGHT + (headerLines + descriptionLines + justificationLines) * LINE_HEIGHT;
    return estimatedHeight < ATOMIC_LIMIT;
};

interface ComponentCardShape {
    name: string | null | undefined;
    description: string | null | undefined;
}

export const componentCardFitsOnOnePage = ({ name, description }: ComponentCardShape): boolean => {
    const estimatedHeight =
        CARD_CHROME_HEIGHT +
        (textLines(name, FULL_WIDTH_CHARS_PER_LINE) + 1 + textLines(description, FULL_WIDTH_CHARS_PER_LINE)) *
            LINE_HEIGHT;
    return estimatedHeight < ATOMIC_LIMIT;
};

interface MeasureCardShape {
    name: string | null | undefined;
    description: string | null | undefined;
    threats: readonly { name?: string | null | undefined }[];
}

export const measureCardFitsOnOnePage = ({ name, description, threats }: MeasureCardShape): boolean => {
    const headerLines = textLines(name, FULL_WIDTH_CHARS_PER_LINE) + 2;
    const descriptionLines = description ? 1 + textLines(description, COLUMN_CHARS_PER_LINE) : 0;
    // linked threats render as one row each; charge the name at full width plus row spacing
    const threatLines = threats.reduce((sum, threat) => sum + 1 + textLines(threat.name, FULL_WIDTH_CHARS_PER_LINE), 0);
    const estimatedHeight = CARD_CHROME_HEIGHT + (headerLines + descriptionLines + threatLines) * LINE_HEIGHT;
    return estimatedHeight < ATOMIC_LIMIT;
};
