import { styled } from "@mui/material/styles";
import { Box, Slider, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { calcRiskColourFromRisk } from "../../utils/calcRisk";
import MATRIX_COLOR from "../colors/matrix";

const LineOfToleranceSlider = styled(Slider)(() => ({
    height: 2,
    "& .MuiSlider-track": {
        border: "none",
        backgroundColor: MATRIX_COLOR.yellow.border,
    },
    "& .MuiSlider-rail": {
        background:
            "linear-gradient(to right, " +
            MATRIX_COLOR.green.selected +
            " 0 50%, " +
            MATRIX_COLOR.red.border +
            " 50% 100%);",
    },
    "& .MuiSlider-mark": {
        backgroundColor: MATRIX_COLOR.yellow.border,
        height: 8,
        width: 2,
    },
    "& [data-index='0']": {
        backgroundColor: MATRIX_COLOR.green.border + " !important", // e53935
        height: 16,
        marginLeft: "1px",
    },
    "& [data-index='15']": {
        backgroundColor: MATRIX_COLOR.red.border + " !important", // 43a047
        height: 16,
    },
    "& [data-index='1']:last-child": {
        backgroundColor: MATRIX_COLOR.red.border,
    },

    "& .MuiSlider-thumb": {
        height: 24,
        width: 3,
        backgroundColor: MATRIX_COLOR.green.border,
        //borderRadius: "initial",
        boxShadow: "none",
        zIndex: 99,
        borderRadius: 2,
        marginLeft: 0,
    },
}));

export const LineOfToleranceSelector = ({ title, greenValue, redValue, onLoTChange }) => {
    // slider should stop only on steps where anything actually changes in the matrix, beeing only
    // multiples of 2, 3, 4 and 5
    const marksvals = useMemo(
        () => [
            { value: 0 },
            { value: 1 },
            { value: 2 },
            { value: 3 },
            { value: 4 },
            { value: 5 },
            { value: 6 },
            { value: 8 },
            { value: 9 },
            { value: 10 },
            { value: 12 },
            { value: 15 },
            { value: 16 },
            { value: 20 },
            { value: 25 },
            { value: 26 },
        ],
        []
    );

    // the slider is equidistant, so convert to actual risk values
    const stepValue = useCallback(
        (val) => {
            return marksvals[val].value;
        },
        [marksvals]
    );

    // find stop values to risk value
    const findStep = useCallback(
        (val) =>
            marksvals.findIndex((element) => {
                return val === element.value;
            }),
        [marksvals]
    );

    const userRole = useSelector((state) => state.projects.current?.role);

    const sliderRef = useRef();

    // display the right colors on slider background and marks for given linear values
    const colorSlider = useCallback(
        (greenP, redP) => {
            if (sliderRef?.current) {
                const rail = sliderRef.current.getElementsByClassName("MuiSlider-rail")[0];
                if (rail) {
                    // colouring of rail according to linear stop indices
                    const greenValuePercentage = (greenP / (marksvals.length - 1)) * 100;
                    const redValuePercentage = (redP / (marksvals.length - 1)) * 100;
                    rail.style.backgroundImage =
                        "linear-gradient(to right, " +
                        MATRIX_COLOR.green.border +
                        " 0 " +
                        greenValuePercentage +
                        "%, " +
                        MATRIX_COLOR.red.border +
                        "  " +
                        redValuePercentage +
                        "% 100%)";
                }

                const marks = sliderRef.current.getElementsByClassName("MuiSlider-mark");
                for (let i = 0; i < marks.length; i++) {
                    marks[i].style.backgroundColor =
                        MATRIX_COLOR[calcRiskColourFromRisk(stepValue(i), stepValue(greenP), stepValue(redP))].border;
                }
            }
        },
        [marksvals.length, stepValue]
    );

    const onValueChanged = (_, newValue) => {
        // newValue is (linear) slider stop index
        colorSlider(newValue[0], newValue[1]);
        onLoTChange([stepValue(newValue[0]), stepValue(newValue[1])], false);
    };

    const OnValueSaved = (_, newValue) => {
        onLoTChange([stepValue(newValue[0]), stepValue(newValue[1])], true);
    };

    useEffect(() => {
        colorSlider(findStep(greenValue), findStep(redValue));
    }, [colorSlider, findStep, greenValue, redValue]);

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                alignItems: "flex-start",
                zIndex: 999,
                marginTop: 3,
                width: "100%",
                paddingLeft: 2.8,
            }}
        >
            <Box sx={{ display: "flex", width: "100%" }}>
                <LineOfToleranceSlider
                    sx={{
                        width: "99%",
                    }}
                    disabled={!checkUserRole(userRole, USER_ROLES.EDITOR)}
                    step={1}
                    marks
                    scale={stepValue}
                    valueLabelDisplay="auto"
                    min={0}
                    max={marksvals.length - 1}
                    track={"inverted"}
                    onChange={onValueChanged}
                    onChangeCommitted={OnValueSaved}
                    value={[findStep(greenValue), findStep(redValue)]}
                    ref={sliderRef}
                />
            </Box>
            <Typography
                sx={{
                    paddingTop: 0.25,
                    boxSizing: "border-box",
                    fontSize: "10px",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                }}
            >
                {title}
            </Typography>
        </Box>
    );
};
