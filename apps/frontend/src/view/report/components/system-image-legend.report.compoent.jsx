import { View } from "@react-pdf/renderer";
import { POINTS_OF_ATTACK } from "../../../api/types/points-of-attack.types";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { useTranslation } from "react-i18next";
import { Text } from "./text.report.component";
import { s1 } from "../report.style";

export const SystemImageLegend = ({ language, style, ...props }) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                ...style,
                display: "flex",
                flexWrap: "wrap",
                flexDirection: "row",
                alignItems: "center",
            }}
            {...props}
        >
            {Object.values(POINTS_OF_ATTACK).map((pointOfAttack) => (
                <View
                    key={pointOfAttack}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={{
                            borderRadius: 10,
                            height: s1,
                            width: s1,
                            backgroundColor: POA_COLORS[pointOfAttack].normal,
                        }}
                    />
                    <Text
                        style={{
                            paddingLeft: s1 / 2,
                            paddingRight: s1,
                        }}
                        size="small"
                    >
                        {t("pointsOfAttacks." + pointOfAttack + ".name")}
                    </Text>
                </View>
            ))}
        </View>
    );
};
