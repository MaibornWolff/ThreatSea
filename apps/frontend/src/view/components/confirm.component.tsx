import { DialogActions, Typography } from "@mui/material";
import { Box } from "@mui/system";
import type { ComponentProps } from "react";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { Button } from "../components/button.component";
import { Dialog } from "./dialog.component";

export const Confirm = () => {
    const {
        open,
        message,
        cancelText = null,
        acceptText,
        acceptColor = "error",
        cancelConfirm,
        acceptConfirm,
    } = useConfirm();

    const confirmButtonColor = acceptColor as ComponentProps<typeof Button>["color"];

    return (
        <Dialog open={open} maxWidth={"xs"} fullWidth={false} onBackdropClick={cancelConfirm}>
            <Box>
                <Typography>
                    {typeof message === "object"
                        ? [
                              message.preHighlightText,
                              <span key="highlighted-text" style={{ fontWeight: "bold" }}>
                                  {message.highlightedText}
                              </span>,
                              message.afterHighlightText,
                          ]
                        : message}
                </Typography>
                <DialogActions sx={{ padding: 0, marginTop: 2 }}>
                    {cancelText != null && (
                        <Button data-testid="cancel-button" sx={{ marginRight: 0 }} onClick={cancelConfirm}>
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        data-testid="confirm-button"
                        color={confirmButtonColor}
                        onClick={acceptConfirm}
                        sx={{
                            marginRight: 0,
                        }}
                    >
                        {acceptText}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
