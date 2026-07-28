import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { isStandardIconSymbol } from "#view/icons/standard-icons.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";

interface EditorSidebarComponentIconProps {
    symbol: string | null;
    userRole: USER_ROLES | undefined;
    onChangeIcon: () => void;
}

/**
 * Sidebar section (issue #577) that shows the selected component's current icon with a control to
 * change it. The chosen icon applies to this component instance only; the component type is untouched.
 * `onChangeIcon` opens the picker dialog owned by the editor page.
 */
export const EditorSidebarComponentIcon = ({ symbol, userRole, onChangeIcon }: EditorSidebarComponentIconProps) => {
    const { t } = useTranslation("editorPage");
    const isStandardIcon = isStandardIconSymbol(symbol);

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    backgroundColor: "background.paperWhite",
                    borderRadius: 15,
                    height: "31px",
                    paddingLeft: 8,
                    paddingRight: 0,
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 4,
                    marginBottom: 2,
                    marginLeft: -8,
                    marginRight: -8,
                }}
            >
                <Typography sx={{ fontWeight: "bold", fontSize: "0.75rem", color: "text.primary" }}>
                    {t("sidebar.icon.title")}
                </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
                <Avatar
                    src={symbol ?? undefined}
                    variant="square"
                    alt=""
                    sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: "transparent",
                        // Wide icons (e.g. Communication Infrastructure) need `square` to drop the Avatar's
                        // circular clip AND `contain` to override its default `cover`, so they show whole.
                        "& .MuiAvatar-img": { objectFit: "contain" },
                    }}
                />
                <Typography sx={{ fontSize: "0.75rem", color: "text.primary" }}>
                    {isStandardIcon ? t("sidebar.icon.standard") : t("sidebar.icon.custom")}
                </Typography>
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <Button
                        onClick={onChangeIcon}
                        startIcon={<AddPhotoAlternateOutlined sx={{ fontSize: 16 }} />}
                        data-testid="change-component-icon"
                        sx={{
                            marginLeft: "auto",
                            fontSize: "0.75rem",
                            textTransform: "none",
                            color: "text.primary",
                            "&:hover": { backgroundColor: "background.paperIntransparent" },
                        }}
                    >
                        {t("sidebar.icon.change")}
                    </Button>
                )}
            </Box>
        </>
    );
};
