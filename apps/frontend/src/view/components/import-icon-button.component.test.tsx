import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportIconButton } from "./import-icon-button.component";

describe("ImportIconButton", () => {
    it("should render a button", () => {
        render(<ImportIconButton id="import-btn" tooltipTitle="Import data" />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render a hidden file input with the given id", () => {
        render(<ImportIconButton id="my-import" tooltipTitle="Import" />);
        const input = document.getElementById("my-import") as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.type).toBe("file");
        expect(input).not.toBeVisible();
    });

    it("should associate the label with the file input via id", () => {
        render(<ImportIconButton id="upload-input" tooltipTitle="Upload" />);
        const label = screen.getByRole("button").closest("label");
        expect(label).toHaveAttribute("for", "upload-input");
    });

    it("should show a tooltip with the tooltipTitle on hover", async () => {
        render(<ImportIconButton id="import-btn" tooltipTitle="Import threats" />);

        await userEvent.hover(screen.getByRole("button"));

        expect(await screen.findByRole("tooltip", { name: "Import threats" })).toBeInTheDocument();
    });

    it("should accept .csv and JSON files", () => {
        render(<ImportIconButton id="import-btn" tooltipTitle="Import" />);
        const input = document.getElementById("import-btn") as HTMLInputElement;
        expect(input.accept).toBe(".csv, application/JSON");
    });

    it("should call onChange when a file is selected", async () => {
        const handleChange = vi.fn();
        render(<ImportIconButton id="import-btn" tooltipTitle="Import" onChange={handleChange} />);

        const file = new File(["content"], "data.json", { type: "application/json" });
        const input = document.getElementById("import-btn") as HTMLInputElement;
        await userEvent.upload(input, file);

        expect(handleChange).toHaveBeenCalledTimes(1);
    });
});
