import { Checkbox, ListItemText, MenuItem, Select } from "@mui/material";
import { parseSelectionFilter } from "#utils/column-filters.ts";

interface SelectionFilterProps<Value extends string> {
    field: string;
    options: readonly Value[];
    columnFilters: Record<string, string>;
    onFilterChange: (field: string, value: string) => void;
    optionLabel: (option: Value) => string;
    // How the closed dropdown names a selected option, if shorter than in the menu.
    selectedLabel?: (option: Value) => string;
    allLabel: string;
}

// A row matches if it has any of the ticked options; nothing ticked means all.
export const SelectionFilter = <Value extends string>({
    field,
    options,
    columnFilters,
    onFilterChange,
    optionLabel,
    selectedLabel = optionLabel,
    allLabel,
}: SelectionFilterProps<Value>) => {
    const selectedOptions = parseSelectionFilter(options, columnFilters[field]);
    return (
        <Select<Value[]>
            multiple
            size="small"
            value={selectedOptions}
            onChange={(event) => {
                const selectedValues = event.target.value as Value[];
                onFilterChange(field, options.filter((option) => selectedValues.includes(option)).join(","));
            }}
            onClick={(event) => event.stopPropagation()}
            displayEmpty
            renderValue={(selectedValues) =>
                selectedValues.length === 0 ? allLabel : selectedValues.map(selectedLabel).join(", ")
            }
            sx={{ width: "100%" }}
        >
            {options.map((option) => (
                <MenuItem key={option} value={option}>
                    <Checkbox size="small" checked={selectedOptions.includes(option)} />
                    <ListItemText primary={optionLabel(option)} />
                </MenuItem>
            ))}
        </Select>
    );
};
