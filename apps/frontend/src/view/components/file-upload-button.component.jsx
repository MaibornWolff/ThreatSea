import { Button } from "./button.component";

export const FileUploadButton = ({ id, children, inputProps, ...props }) => {
    return (
        <label htmlFor={id}>
            <input id={id} type="file" {...inputProps} style={{ display: "none" }} />
            <Button component="span" color="primary" {...props}>
                {children}
            </Button>
        </label>
    );
};
