import { Box, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";

const TimeSlider = styled(Slider)(({ theme }) => ({
    height: 2,
    marginBottom: theme.spacing(4),
    "& .MuiSlider-thumb": {
        height: 25,
        width: 3,
        backgroundColor: "rgba(35, 60, 87, 1)",
        boxShadow: "none",
        borderRadius: 2,
    },
    "& .MuiSlider-valueLabel": {
        fontSize: 16,
        fontWeight: "normal",
        top: 70,
        backgroundColor: "unset",
        color: theme.palette.text.primary,
        "&:before": {
            display: "none",
        },
        "& *": {
            background: "transparent",
            color: "text.primary",
        },
    },
    "& .MuiSlider-track": {
        border: "none",
    },
    "& .MuiSlider-rail": {
        opacity: 1, // 0.5,
        height: 2,
        backgroundColor: "rgba(35, 60, 87, 1)", // "#bfbfbf",
        borderRadius: 2,
    },
    "& .MuiSlider-markLabel": {
        opacity: 0,
        top: -25,
    },
    "& .MuiSlider-mark": {
        backgroundColor: "rgba(35, 60, 87, 1)",
        height: 24,
        width: 2,
        "::before": {
            display: "inline-block",
            content: '" "',
            width: 22,
            height: 35,
            backgroundColor: "#0000",
            opacity: 0.5,
            marginLeft: "-10px",
            marginTop: "-5px",
        },
        "&:hover + .MuiSlider-markLabel": {
            opacity: 1,
        },
        "&.MuiSlider-markActive": {
            opacity: 1,
            backgroundColor: "rgba(35, 60, 87, 1)",
        },
        "&:hover + .MuiSlider-valueLabel": {
            color: "#f00",
            backgroundColor: "#f00",
        },
    },
}));

export const MeasureTimeline = ({ timeline, onChange, ...props }) => {
    const { marks = [], minValue = 0, maxValue = 0 } = timeline;

    function valueLabelFormat(value) {
        const index = marks.findIndex((mark) => mark.value === value);
        return index >= 0 ? marks[index].tooltipText : value === -1 ? "Start" : null;
    }

    const handleChange = (e, value) => {
        const mark = marks.find((mark) => mark.value === value);
        if (mark) {
            onChange(e, mark.date);
        }
    };

    return (
        <Box display="flex" alignItems="center" paddingLeft={"2px"} paddingRight={1} {...props}>
            <TimeSlider
                defaultValue={-1}
                valueLabelFormat={valueLabelFormat}
                valueLabelDisplay="on"
                marks={marks}
                min={minValue}
                max={maxValue}
                step={null}
                track={false}
                onChange={handleChange}
            />
        </Box>
    );
};
