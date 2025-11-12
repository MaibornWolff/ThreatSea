import type { ReactNode } from "react";
import { Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { primaryColor, s1 } from "../report.style";

interface ChipProps {
    color?: string;
    children: ReactNode;
    style?: Style;
}

export const Chip = ({ color = primaryColor, children, style }: ChipProps) => {
    return (
        <Text
            style={{
                backgroundColor: color,
                padding: s1 / 2,
                borderRadius: 15,
                fontSize: 10,
                color: "#fff",
                ...(style ?? {}),
            }}
        >
            {children}
        </Text>
    );
};
