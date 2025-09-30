import React, { forwardRef, useEffect, useState } from "react";
import { FormControl, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";

// Preselected icons suitable for communication interfaces
const preselectedIcons = [
    "Wifi",
    "WifiTethering",
    "Bluetooth",
    "Language",
    "Cloud",
    "CloudQueue",
    "Router",
    "Settings",
    "SettingsEthernet",
    "SettingsInputAntenna",
    "SettingsInputComponent",
    "SettingsInputHdmi",
    "SettingsRemote",
    "SignalCellular4Bar",
    "SignalWifi4Bar",
    "Usb",
    "Cast",
    "Devices",
    "DeviceHub",
    "Memory",
    "Storage",
    "Dns",
    "NetworkCheck",
    "VpnLock",
    "Http",
];

const IconSelectorInner = ({ value, onChange, label, error, helperText }, ref) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleIcons, setVisibleIcons] = useState(preselectedIcons);
    const [selectedIcon, setSelectedIcon] = useState(value || "");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (searchTerm === "") {
            setVisibleIcons(preselectedIcons);
        } else {
            const filteredIcons = Object.keys(MuiIcons)
                .filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 25);
            setVisibleIcons(filteredIcons);
        }
    }, [searchTerm]);

    const handleIconChange = (iconName) => {
        setSelectedIcon(iconName);
        setOpen(false);
        onChange({ target: { value: iconName } });
    };

    return (
        <FormControl fullWidth error={error}>
            <InputLabel>{label}</InputLabel>
            <Select
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                value={selectedIcon}
                onChange={(e) => handleIconChange(e.target.value)}
                label={label}
                renderValue={(selected) => (
                    <IconButton size="small" disableRipple>
                        {React.createElement(MuiIcons[selected])}
                    </IconButton>
                )}
                defaultValue=""
            >
                <MenuItem>
                    <TextField
                        fullWidth
                        placeholder="Search icons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent closing the select when clicking on the search field
                    />
                </MenuItem>
                <MenuItem>
                    <Grid container spacing={1} sx={{ width: 250, height: 250 }}>
                        {visibleIcons.map((iconName) => (
                            <Grid item xs={2.4} key={iconName}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleIconChange(iconName);
                                    }}
                                    sx={{
                                        color: selectedIcon === iconName ? "primary.main" : "inherit",
                                        backgroundColor: selectedIcon === iconName ? "action.selected" : "transparent",
                                    }}
                                >
                                    {React.createElement(MuiIcons[iconName])}
                                </IconButton>
                            </Grid>
                        ))}
                    </Grid>
                </MenuItem>
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};

const IconSelector = forwardRef(IconSelectorInner);

export default IconSelector;
