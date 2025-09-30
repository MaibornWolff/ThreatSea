import React from "react";
import { View } from "@react-pdf/renderer";
import MATRIX_COLOR from "../../colors/matrix";
import { Text } from "./text.report.component";
import { largeFontSize, smallFontSize, backgroundColor, s1 } from "../report.style";
import { useTranslation } from "react-i18next";

export const Matrix = ({ language, title, data, style, cellSize = 40 }) => {
    const cellFontSize = cellSize < 30 ? smallFontSize : largeFontSize;
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                ...style,
            }}
            wrap={false}
        >
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Text
                    size="small"
                    style={{
                        textAlign: "left",
                        marginBottom: 2,
                    }}
                >
                    {t("probability")}
                </Text>
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                }}
            >
                {data.map((row, i) => {
                    return (
                        <View
                            key={i}
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor,
                                    width: 20,
                                    height: cellSize,
                                    borderRadius: 3,
                                    margin: 1,
                                }}
                            >
                                <Text style={{ fontSize: 10 }}>{5 - i}</Text>
                            </View>
                            {row.map((cell, j) => {
                                const { color, amount } = cell;
                                const backgroundColor =
                                    (amount ? MATRIX_COLOR[color]?.standard : MATRIX_COLOR[color]?.light) || "#aaa";
                                return (
                                    <View
                                        key={j}
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor,
                                            width: cellSize,
                                            height: cellSize,
                                            borderRadius: 3,
                                            margin: 1,
                                        }}
                                    >
                                        <Text style={{ fontSize: cellFontSize }}>{amount ? amount : " "}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    {[null, null, null, null, null].map((_, i) => {
                        return (
                            <View
                                key={i}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor,
                                    width: cellSize,
                                    height: 20,
                                    borderRadius: 3,
                                    margin: 1,
                                }}
                            >
                                <Text style={{ fontSize: 10 }}>{i + 1}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
            <View
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                }}
            >
                <Text
                    size="small"
                    style={{
                        textAlign: "right",
                        marginTop: 2,
                    }}
                >
                    {t("damage")}
                </Text>
            </View>
            {title && (
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: s1,
                    }}
                >
                    <Text
                        size="small"
                        style={{
                            textAlign: "right",
                            fontWeight: "bold",
                        }}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </View>
    );
};
