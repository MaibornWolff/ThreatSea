import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { FormControl, FormHelperText, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { DynamicMuiIcon } from "#view/components/dynamic-mui-icon.component.tsx";
import { useMuiIconNames } from "#application/hooks/use-mui-icons.hook.ts";

interface IconSelectorProps {
    value?: string;
    onChange: (iconName: string) => void;
    label: string;
    error?: boolean;
    helperText?: ReactNode;
}

// Preselected icons suitable for communication interfaces
const preselectedIcons: readonly string[] = [
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
    const [visibleIcons, setVisibleIcons] = useState<readonly string[]>(preselectedIcons);
    const [selectedIcon, setSelectedIcon] = useState(value || "");
    const [open, setOpen] = useState(false);
    const allIconNames = useMuiIconNames();

    useEffect(() => {
        setSelectedIcon(value || "");
    }, [value]);

    const setVisibleIconsEvent = useEffectEvent((icons: readonly string[]) => {
        setVisibleIcons(icons);
    });

    useEffect(() => {
        if (searchTerm === "") {
            setVisibleIconsEvent(preselectedIcons);
        } else {
            const filteredIcons = allIconNames
                .filter((iconName) => iconName.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 25);
            setVisibleIconsEvent(filteredIcons);
        }
    }, [searchTerm, allIconNames]);

    const handleIconChange = (iconName: string) => {
        setSelectedIcon(iconName);
        setOpen(false);
        onChange(iconName);
    };

    const hasSelection = !!selectedIcon || open;

    return (
        <FormControl fullWidth error={!!error}>
            <InputLabel shrink={hasSelection}>{label}</InputLabel>
            <Select
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                value=""
                displayEmpty
                notched={hasSelection}
                label={label}
                MenuProps={{
                    slotProps: {
                        paper: {
                            sx: {
                                bgcolor: "background.paperIntransparent",
                            },
                        },
                    },
                }}
                renderValue={() => {
                    if (!selectedIcon) {
                        return null;
                    }
                    return (
                        <IconButton size="small" disableRipple>
                            <DynamicMuiIcon iconName={selectedIcon} />
                        </IconButton>
                    );
                }}
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
                            <Grid size={2.4} key={iconName}>
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
                                    <DynamicMuiIcon iconName={iconName} />
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
