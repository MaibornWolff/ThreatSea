import writeXlsxFile, { getSheetData, type Cell } from "write-excel-file/browser";
import { hasOwnProperty } from "./helpers";

interface TabHeader {
    label: string;
    property: string;
}

export interface Tab {
    name: string;
    items: object[];
    header: TabHeader[];
}

function inferCellValue(val: unknown): Cell {
    if (typeof val === "number") {
        return { value: val, type: Number };
    }
    if (typeof val === "boolean") {
        return { value: val, type: Boolean };
    }
    if (typeof val === "string") {
        return { value: val.replace(/\n/g, " "), type: String };
    }
    return { value: "", type: String };
}

export async function exportAsExcelFile(tabs: Tab[], name = "file.xlsx") {
    const sheets = tabs.map((tab) => {
        const columns = tab.header.map((head) => ({
            header: { value: head.label, type: String },
            cell: (row: Record<string, unknown>) => inferCellValue(row[head.property]),
        }));
        return {
            data: getSheetData(tab.items as Record<string, unknown>[], columns),
            sheet: tab.name,
        };
    });

    await writeXlsxFile(sheets).toFile(name);
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const FORMULA_ESCAPE = "'";
const TAB_LINE_PREFIX = "Tab:";

function toCsvCell(value: string): string {
    const neutralisedValue = FORMULA_PREFIX.test(value) ? FORMULA_ESCAPE + value : value;
    return `"${neutralisedValue.replace(/"/g, '""')}"`;
}

/**
 * Builds the csv content for the given tabs. Every cell is quoted (RFC 4180), so delimiters, quotes and
 * line breaks in values keep the row structure, and values that a spreadsheet would run as a formula
 * are prefixed with an apostrophe.
 *
 * @param {Tab[]} tabs - Tabs that are exported.
 * @param {string} delimiter - Delimiter used.
 * @returns {string} The csv content.
 */
export function buildCsvContent(tabs: Tab[], delimiter = ";"): string {
    let csvContent = "";

    tabs.forEach((tab) => {
        const headerLabels = tab.header.map((head) => head.label);
        const headerProperties = tab.header.map((head) => head.property);

        const rows = [
            headerLabels,
            ...tab.items.map((item) =>
                headerProperties.map((headerProperty) =>
                    hasOwnProperty(item, headerProperty) ? (item[headerProperty]?.toString() ?? "") : ""
                )
            ),
        ];
        csvContent +=
            TAB_LINE_PREFIX + tab.name + "\n" + rows.map((row) => row.map(toCsvCell).join(delimiter)).join("\n") + "\n";
    });

    return csvContent;
}

/**
 * Exports the given data into a csv file.
 *
 * @param {Tab[]} tabs - Tabs that are exported.
 * @param {string} name - Name of the csv file.
 * @param {string} delimiter - Delimiter used.
 */
export function exportAsCsvFile(tabs: Tab[], name = "file.csv", delimiter = ";") {
    const blob = new Blob([buildCsvContent(tabs, delimiter)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", Date.now() + "_" + name);
    link.click();

    URL.revokeObjectURL(url);
}

function fromCsvCell(value: string): string {
    return value.startsWith(FORMULA_ESCAPE) && FORMULA_PREFIX.test(value.slice(1)) ? value.slice(1) : value;
}

/**
 * Splits csv content into rows of cells. Supports quoted cells (RFC 4180) with delimiters, escaped
 * quotes and line breaks inside, as well as unquoted cells and \r\n line endings. Empty lines are
 * skipped.
 *
 * @param {string} content - The csv content.
 * @param {string} delimiter - Delimiter used.
 * @returns {string[][]} The rows with their cells.
 */
export function parseCsvRows(content: string, delimiter = ";"): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let isQuoted = false;

    const endCell = () => {
        row.push(fromCsvCell(cell));
        cell = "";
    };
    const endRow = () => {
        endCell();
        if (row.length > 1 || row[0] !== "") {
            rows.push(row);
        }
        row = [];
    };

    for (let index = 0; index < content.length; index++) {
        const character = content[index];

        if (isQuoted) {
            if (character === '"' && content[index + 1] === '"') {
                cell += '"';
                index++;
            } else if (character === '"') {
                isQuoted = false;
            } else {
                cell += character;
            }
        } else if (character === '"' && cell === "") {
            isQuoted = true;
        } else if (character === delimiter) {
            endCell();
        } else if (character === "\n") {
            endRow();
        } else if (character === "\r" && content[index + 1] === "\n") {
            continue;
        } else {
            cell += character;
        }
    }
    endRow();

    return rows;
}

/**
 * Parses a csv file and imports the data into threatsea.
 *
 * @param {Blob} file - The file csv that is parsed.
 * @param {function} parse - Function that tells which data is parsed.
 * @param {function} validate - Function that validates the data.
 * @param {string} delimiter - Delimiter used in the csv file.
 * @returns {Promise} A Promise that either holds an error or the imported data.
 */
export function importCsvFile(
    file: Blob,
    parse: (data: string[]) => object,
    validate: (data: object) => void,
    delimiter = ";"
): Promise<{ header: string[]; rows: object[] } | null> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            const str: string | null = reader.result as string | null;
            if (str === null) {
                resolve(null);
                return;
            }
            const csvRows = parseCsvRows(str, delimiter);
            // Files from exportAsCsvFile start with a "Tab:<name>" line before the header.
            if (csvRows[0]?.length === 1 && csvRows[0][0]?.startsWith(TAB_LINE_PREFIX)) {
                csvRows.shift();
            }
            const header = csvRows.shift() ?? [];
            const rows = csvRows.map((rowCells) => parse(rowCells));
            rows.forEach((row, i) => {
                try {
                    validate(row);
                } catch (error) {
                    reject(new Error("row number " + (i + 1) + " invalid: " + (error as Error).message));
                }
            });
            resolve({ header, rows });
        };

        reader.onerror = (err) => {
            reject(err);
        };

        reader.readAsText(file);
    });
}

/**
 * Exports the given data into a csv file.
 *
 * @param {string} name - Name of the JSON file.
 * @param {object} data - object to be exported.
 */
export function exportAsJsonFile(name = "file.json", data: object) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/JSON" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = name;
    link.click();
}
