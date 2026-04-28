import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploadButton } from "./file-upload-button.component";

describe("FileUploadButton", () => {
    it("should render its children as the button label", () => {
        render(<FileUploadButton id="upload">Upload file</FileUploadButton>);
        expect(screen.getByText("Upload file")).toBeInTheDocument();
    });

    it("should render a hidden file input", () => {
        render(<FileUploadButton id="upload">Upload</FileUploadButton>);
        const input = document.getElementById("upload") as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.type).toBe("file");
        expect(input).not.toBeVisible();
    });

    it("should associate the label with the file input via id", () => {
        render(<FileUploadButton id="my-upload">Choose file</FileUploadButton>);
        const label = screen.getByText("Choose file").closest("label");
        expect(label).toHaveAttribute("for", "my-upload");
    });

    it("should forward inputProps to the file input", () => {
        render(
            <FileUploadButton id="upload" inputProps={{ accept: ".json" }}>
                Upload
            </FileUploadButton>
        );
        const input = document.getElementById("upload") as HTMLInputElement;
        expect(input.accept).toBe(".json");
    });

    it("should call the onChange handler from inputProps when a file is selected", async () => {
        const handleChange = vi.fn();
        render(
            <FileUploadButton id="upload" inputProps={{ onChange: handleChange }}>
                Upload
            </FileUploadButton>
        );

        const file = new File(["content"], "test.json", { type: "application/json" });
        const input = document.getElementById("upload") as HTMLInputElement;
        await userEvent.upload(input, file);

        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("should render without an id when none is provided", () => {
        render(<FileUploadButton>Upload</FileUploadButton>);
        expect(screen.getByText("Upload")).toBeInTheDocument();
        // The hidden input exists but has no id attribute
        const input = document.querySelector("input[type='file']") as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.id).toBe("");
    });
});
