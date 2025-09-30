import React, { useMemo } from "react";
import { Text as PdfText } from "@react-pdf/renderer";
import { fontColor, headerFontSize, largeFontSize, smallFontSize } from "../report.style";

export const Text = ({ size = "large", color = fontColor, style, children, render, ...props }) => {
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
                ...style,
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
                ...style,
            }}
            {...props}
        >
            {content}
        </PdfText>
    );
};
