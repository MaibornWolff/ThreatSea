export const FONT_SIZE_CHOICES = [12, 14, 16, 18, 24, 32, 48];

export const formatToggleSx = (active: boolean) => ({
    color: active ? "text.buttonselected" : "text.secondary",
    backgroundColor: active ? "primary.main" : "transparent",
    "&:hover": {
        backgroundColor: active ? "primary.main" : "background.paperIntransparent",
    },
});
