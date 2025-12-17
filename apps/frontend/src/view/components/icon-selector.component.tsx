import { createElement, useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { FormControl, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import * as MuiIcons from "@mui/icons-material";

interface IconSelectorProps {
    value?: string;
    onChange: (iconName: string) => void;
    label: string;
    error?: boolean;
    helperText?: ReactNode;
}

type MuiIconKey = keyof typeof MuiIcons;

// Preselected icons suitable for communication interfaces
const preselectedIcons: readonly MuiIconKey[] = [
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
] as const;

export const IconSelector = ({ value, onChange, label, error, helperText }: IconSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleIcons, setVisibleIcons] = useState<readonly MuiIconKey[]>(preselectedIcons);
    const [selectedIcon, setSelectedIcon] = useState(value || "");
    const [open, setOpen] = useState(false);

    const setVisibleIconsEvent = useEffectEvent((icons: MuiIconKey[]) => {
        setVisibleIcons(icons);
    });

    useEffect(() => {
        if (searchTerm === "") {
            setVisibleIconsEvent(preselectedIcons as MuiIconKey[]);
        } else {
            const filteredIcons = Object.keys(MuiIcons)
                .filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 25);
            setVisibleIconsEvent(filteredIcons as MuiIconKey[]);
        }
    }, [searchTerm]);

    const handleIconChange = (iconName: string) => {
        setSelectedIcon(iconName);
        setOpen(false);
        onChange(iconName);
    };

    return (
        <FormControl fullWidth error={!!error}>
            <InputLabel>{label}</InputLabel>
            <Select
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                value={selectedIcon}
                onChange={(e: SelectChangeEvent<string>) => handleIconChange(e.target.value)}
                label={label}
                renderValue={(selected) => (
                    <IconButton size="small" disableRipple>
                        {(() => {
                            const IconComponent = selected
                                ? (MuiIcons[selected as MuiIconKey] as React.ElementType | undefined)
                                : undefined;
                            return IconComponent ? createElement(IconComponent) : null;
                        })()}
                    </IconButton>
                )}
                defaultValue=""
            >
                <MenuItem>
                    <TextField
                        fullWidth
                        placeholder="Search icons..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                                    {(() => {
                                        const IconComponent = MuiIcons[iconName];
                                        return IconComponent ? createElement(IconComponent) : null;
                                    })()}
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
