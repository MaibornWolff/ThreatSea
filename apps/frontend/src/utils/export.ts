/**
 * @module export - Defines the export/import
 *     for threats/measures/assets.
 */
import Excel from "exceljs";
import { hasOwnProperty } from "./helpers";

interface TabHeader {
    label: string;
    property: string;
}

interface Tab {
    name: string;
    items: object[];
    header: TabHeader[];
}

/**
 * Exports the given data into a csv file.
 *
 * @param {array of object} items - Items that are exported.
 * @param {array of object} header - Header for the csv file.
 * @param {string} name - Name of the csv file.
 * @param {string} delimiter - Delimiter used.
 */
export function exportAsCsvFile(tabs: Tab[], name = "file.csv", delimiter = ";") {
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
        csvContent += "Tab:" + tab.name + "\n" + rows.map((e) => e.join(delimiter)).join("\n") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", Date.now() + "_" + name);
    link.click();

    URL.revokeObjectURL(url);
}

export function exportAsExcelFile(tabs: Tab[], name = "file.xlsx") {
    const workbook = new Excel.Workbook();

    tabs.forEach((tab) => {
        const sheet = workbook.addWorksheet(tab.name);
        sheet.columns = tab.header.map((head) => ({
            header: head.label,
            key: head.property,
        }));

        tab.items.forEach((item) => {
            const updatedItem = Object.entries(item).reduce(
                (acc: Record<string, number | string | boolean>, [key, value]) => {
                    if (typeof value === "string") {
                        acc[key] = value.replace(/\n/g, " ");
                    } else {
                        acc[key] = value;
                    }
                    return acc;
                },
                {}
            );
            sheet.addRow(updatedItem);
        });
    });

    workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = name;
        link.click();
    });
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
            const header = str.slice(0, str.indexOf("\n")).split(delimiter);
            const rows = str
                .slice(str.indexOf("\n") + 1)
                .split("\n")
                .map((row) => row.split(delimiter))
                .map((rowCells) => parse(rowCells));
            rows.pop();
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
