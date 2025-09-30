import React from "react";
import { View, Image } from "@react-pdf/renderer";
import { primaryColor } from "../report.style";

export const SystemImage = ({ src, style, ...props }) => {
    return (
        <View
            style={{
                border: "1px solid " + primaryColor,
                borderRadius: 5,
                ...style,
            }}
            {...props}
        >
            {src && <Image style={{ width: "100%", height: "auto" }} src={src} />}
        </View>
    );
};
