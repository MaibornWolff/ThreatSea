import type { ComponentProps } from "react";
import { View, Image } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { primaryColor } from "../report.style";

type ViewBaseProps = Omit<ComponentProps<typeof View>, "style">;

interface SystemImageProps extends ViewBaseProps {
    src?: string | null;
    style?: Style;
}

export const SystemImage = ({ src, style, ...props }: SystemImageProps) => {
    return (
        <View
            style={{
                border: "1px solid " + primaryColor,
                borderRadius: 5,
                ...(style ?? {}),
            }}
            {...props}
        >
            {src && <Image style={{ width: "100%", height: "auto" }} src={src} />}
        </View>
    );
};
