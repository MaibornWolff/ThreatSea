import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import MATRIX_COLOR from "../colors/matrix";

const damageAxis = [1, 2, 3, 4, 5];
const probabilityAxis = [5, 4, 3, 2, 1];

export const Matrix = ({ matrix, size = 120, onSelectCell }) => {
    const { t } = useTranslation("riskPage");
    return (
        <Box display="flex" flexDirection="row" alignItems="stretch" sx={{ width: "auto" }}>
            <Typography
                sx={{
                    display: "inline-block",
                    textOrientation: "sideways",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    alignSelf: "flex-start",
                    fontWeight: "bold",
                    marginTop: 0.5,
                    letterSpacing: "1px",
                }}
                fontSize={size / 5}
            >
                {t("probabilityAxis")}
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
                {matrix.map((row, i) => (
                    <Box
                        key={i}
                        sx={{
                            display: "flex",
                            marginLeft: 0.25,
                        }}
                    >
                        <AxisCell size={size} variant="y" fontSize={"10px"}>
                            {probabilityAxis[i]}
                        </AxisCell>
                        {row.map((cell, j) => (
                            <MatrixCell
                                key={j}
                                size={size}
                                probability={probabilityAxis[i]}
                                damage={damageAxis[j]}
                                fontSize={"0.875rem"}
                                foregroundColor={"#fff"}
                                onClick={onSelectCell}
                                {...cell}
                            />
                        ))}
                    </Box>
                ))}
                <DamageAxis size={size} marginTop={1} title={t("damageAxis")} />
            </Box>
        </Box>
    );
};

const DamageAxis = ({ size, title }) => {
    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    paddingLeft: 3,
                }}
            >
                {damageAxis.map((value, i) => (
                    <AxisCell key={i} variant="x" size={size} fontSize={"10px"}>
                        {value}
                    </AxisCell>
                ))}
            </Box>
            <Typography
                fontSize={size / 5}
                sx={{
                    letterSpacing: "1px",
                    fontWeight: "bold",
                    alignSelf: "flex-end",
                    marginRight: 0.25,
                }}
            >
                {title}
            </Typography>
        </>
    );
};

const AxisCell = ({ children, variant, size, fontSize }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                bgcolor: "matrix.axisCells.background",
                width: variant === "y" ? 20 : size,
                height: variant === "x" ? 20 : "initial",
                margin: "1px",
            }}
        >
            <Box
                fontSize={fontSize ? fontSize : size / 3}
                sx={{
                    color: "matrix.axisCells.color",
                    fontWeight: "bold",
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

const MatrixCell = ({ size, amount, color, selected, probability, damage, onClick, fontSize, foregroundColor }) => {
    const [backgroundColor, borderColor] = useMemo(() => {
        const backgroundColor =
            (selected
                ? MATRIX_COLOR[color]?.selected
                : amount
                  ? MATRIX_COLOR[color]?.standard
                  : MATRIX_COLOR[color]?.light) || "#fff";
        const borderColor = (selected ? MATRIX_COLOR[color]?.selected : MATRIX_COLOR[color]?.border) || "#000";
        return [backgroundColor, borderColor];
    }, [color, selected, amount]);

    return (
        <Box
            sx={{
                display: "flex",
                boxSizing: "border-box",
                width: size,
                height: size,
                backgroundColor,
                borderRadius: 3,
                margin: "1px",
                border: `2px solid ${borderColor}`,
                alignItems: "center",
                "&:hover": {
                    cursor: "pointer",
                },
            }}
            onClick={(e) =>
                onClick(
                    e,
                    selected
                        ? null
                        : {
                              probability,
                              damage,
                          }
                )
            }
        >
            {amount && (
                <Typography
                    margin="0 auto"
                    fontSize={fontSize}
                    color={foregroundColor}
                    sx={{
                        fontWeight: "bold",
                    }}
                >
                    {amount}
                </Typography>
            )}
        </Box>
    );
};
