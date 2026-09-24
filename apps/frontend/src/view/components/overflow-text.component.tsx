import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useLayoutEffect, useRef, useState } from "react";
import { Tooltip } from "#view/components/tooltip.component.tsx";

interface OverflowTextProps {
    text: string;
    testId?: string;
    bold?: boolean;
    align?: "left" | "center";
    /** Extra styles for the flex container, e.g. `flex: 1` (nested next to an icon) or padding. */
    containerSx?: SxProps<Theme>;
}

/**
 * A single-line, ellipsis-truncated text element with a tooltip shown only when the text is
 * actually truncated. The text sits in its own flex container (`min-width: 0` on both the
 * container and the text) so the ellipsis appears reliably whether this is rendered on its own
 * inside a data-grid cell or next to another element such as an expand chevron.
 *
 * The Tooltip is always mounted and merely disabled while the text fits. Toggling the wrapper
 * in and out of the tree would remount the span, detaching the element the measurement effect
 * observes — the ResizeObserver then reports 0×0 for the orphaned node and the truncated state
 * would snap back to false (tooltip never shows).
 */
export const OverflowText = ({ text, testId, bold = false, align = "left", containerSx }: OverflowTextProps) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useLayoutEffect(() => {
        const element = textRef.current;
        if (!element) {
            return;
        }
        // Ignore transient 0×0 readings (e.g. while the grid re-lays out a cell) instead of
        // clearing the truncated state on them.
        const measure = () => {
            const boxWidth = element.getBoundingClientRect().width;
            if (boxWidth <= 0) {
                return;
            }
            // `scrollWidth`/`clientWidth` are integer-rounded, so text that overflows its box by
            // a fraction of a pixel — enough for the browser to still apply the CSS ellipsis —
            // reads as scrollWidth === clientWidth and wrongly suppresses the tooltip. (Observed:
            // an English "attacker" label at 145.03px in a 145px cell — 0.03px over, ellipsis
            // shown, no tooltip.) Whether a label lands on that boundary depends on its exact
            // width, so it varies by locale and column width. Compare the text's true fractional
            // width (via a Range) against the fractional box width to catch the sub-pixel case;
            // the tolerance only rejects float noise, since any real overflow triggers ellipsis.
            const range = document.createRange();
            range.selectNodeContents(element);
            const textWidth = range.getBoundingClientRect().width;
            setIsTruncated(textWidth - boxWidth > 0.01);
        };
        measure();
        // Re-measure on column resize so the tooltip appears/disappears as the fit changes.
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [text]);

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: "100%",
                minWidth: 0,
                // Keep padding from containerSx (e.g. the child-row indent) inside the cell
                // width; without this the container overflows the cell and the ellipsis is
                // clipped away with it.
                boxSizing: "border-box",
                ...containerSx,
            }}
        >
            <Tooltip title={text} disableHoverListener={!isTruncated} disableFocusListener={!isTruncated}>
                <Box
                    ref={textRef}
                    component="span"
                    data-testid={testId}
                    // Focusable only while truncated, so keyboard users can reach the tooltip
                    // with the full text without adding tab stops for fully visible labels.
                    tabIndex={isTruncated ? 0 : undefined}
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.875rem",
                        textAlign: align,
                        fontWeight: bold ? "bold" : "normal",
                    }}
                >
                    {text}
                </Box>
            </Tooltip>
        </Box>
    );
};
