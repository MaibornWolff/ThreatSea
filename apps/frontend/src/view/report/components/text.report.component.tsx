import { useMemo, type ReactNode, type ComponentProps } from "react";
import { Text as PdfText } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { fontColor, headerFontSize, largeFontSize, smallFontSize } from "../report.style";

type PdfTextBaseProps = ComponentProps<typeof PdfText>;
type PdfTextOptionalStyle = Omit<PdfTextBaseProps, "style" | "children">;

type TextSize = "header" | "large" | "small";

interface TextProps extends PdfTextOptionalStyle {
    id?: string;
    size?: TextSize;
    color?: string;
    style?: Style;
    children?: ReactNode;
    render?: (props: { pageNumber: number; totalPages: number }) => ReactNode;
}

export const Text = ({ size = "large", color = fontColor, style, children, render, ...props }: TextProps) => {
    const fontSize = useMemo(() => {
        switch (size) {
            case "header":
                return headerFontSize;
            case "large":
                return largeFontSize;
            case "small":
                return smallFontSize;
            default:
                return "initial";
        }
    }, [size]);
    const content = useMemo(() => (children ? children : " "), [children]);
    return render ? (
        <PdfText
            style={{
                fontSize,
                color,
                fontFamily: "Poppins",
                ...(style ?? {}),
            }}
            render={render}
            {...props}
        />
    ) : (
        <PdfText
            style={{
                fontSize,
                color,
                fontFamily: "Poppins",
                ...(style ?? {}),
            }}
            {...props}
        >
            {content}
        </PdfText>
    );
};
