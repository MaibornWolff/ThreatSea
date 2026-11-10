import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useLayoutEffect, useRef, useState } from "react";
import { Tooltip } from "#view/components/tooltip.component.tsx";

const MAX_LINES = 2;

interface OverflowTextProps {
    text: string;
    testId?: string;
    bold?: boolean;
    align?: "left" | "center";
    /** Extra styles for the flex container, e.g. `flex: 1` (nested next to an icon) or padding. */
    containerSx?: SxProps<Theme>;
}

/**
 * Text wrapped onto at most two lines, ending in an ellipsis with a tooltip shown only when the
 * text is actually cut. The text sits in its own flex container (`min-width: 0` on both the
 * container and the text) so it wraps at the cell width whether this is rendered on its own
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
        const measure = () => {
            // Ignore transient 0×0 readings (e.g. while the grid re-lays out a cell) instead of
            // clearing the truncated state on them.
            if (element.clientHeight <= 0) {
                return;
            }
            // The clamp hides whole lines, so a cut text overflows by a full line height; the
            // tolerance only rejects the integer rounding of scrollHeight and clientHeight.
            setIsTruncated(element.scrollHeight - element.clientHeight > 1);
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
            {/* Non-interactive: the tooltip overlaps the next grid row, and an interactive one would
                keep itself open while the pointer moves onto that row, blocking its own tooltip. */}
            <Tooltip
                title={text}
                disableHoverListener={!isTruncated}
                disableFocusListener={!isTruncated}
                disableInteractive
            >
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
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: MAX_LINES,
                        overflow: "hidden",
                        whiteSpace: "normal",
                        // German compounds such as "Kommunikationsinfrastruktur" have no space to wrap
                        // at; hyphenation follows the page language, break-word is the fallback.
                        hyphens: "auto",
                        overflowWrap: "break-word",
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
