import React from "react";
import { Text } from "@react-pdf/renderer";
import { primaryColor, s1 } from "../report.style";

export const Chip = ({ color = primaryColor, children, style }) => {
    return (
        <Text
            style={{
                backgroundColor: color,
                padding: s1 / 2,
                borderRadius: 15,
                fontSize: 10,
                color: "#fff",
                ...style,
            }}
        >
            {children}
        </Text>
    );
};
