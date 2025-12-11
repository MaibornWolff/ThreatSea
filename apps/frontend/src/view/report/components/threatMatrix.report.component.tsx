import { View } from "@react-pdf/renderer";
import { backgroundColor, primaryColor, s1, s2 } from "../report.style";
import { Text } from "./text.report.component";
import { useTranslation } from "react-i18next";

const cellWidth = 90;

interface ThreatMatrixProps {
    language: string;
}

interface ThreatMatrixPoARowProps {
    language: string;
    pointOfAttack: string;
}

export const ThreatMatrix = ({ language }: ThreatMatrixProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 10,
                marginTop: s2,
                borderColor: backgroundColor,
                border: "0.5px",
                overflow: "hidden",
            }}
        >
            <ThreatMatrixHeaderRow language={language} />
            {Object.keys(t("pointsOfAttacks", { returnObjects: true })).map((poa) => (
                <View key={poa}>
                    <ThreatMatrixPoARow pointOfAttack={poa} language={language}></ThreatMatrixPoARow>
                </View>
            ))}
        </View>
    );
};

const ThreatMatrixHeaderRow = ({ language }: ThreatMatrixProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                backgroundColor: backgroundColor,
            }}
        >
            <View
                style={{
                    width: cellWidth,
                }}
            ></View>
            {Object.keys(t("attackers", { returnObjects: true })).map((attacker) => (
                <View key={attacker}>
                    <Text
                        style={{
                            width: cellWidth,
                        }}
                        size="small"
                    >
                        {t("attackers." + attacker + ".name")}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const ThreatMatrixPoARow = ({ language, pointOfAttack }: ThreatMatrixPoARowProps) => {
    const { t } = useTranslation("report", { lng: language });
    return (
        <View
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "stretch",
                borderColor: primaryColor,
                justifyContent: "space-between",
                borderTop: "0.5px",
            }}
        >
            <Text
                style={{
                    width: cellWidth,
                    padding: s1 / 2,
                    borderColor: primaryColor,
                    backgroundColor: backgroundColor,
                    borderRight: "0.5px",
                }}
                size="small"
            >
                {t("pointsOfAttacks." + pointOfAttack + ".name")}
            </Text>
            {Object.keys(t("attackers", { returnObjects: true })).map((attacker) => (
                <Text
                    key={attacker}
                    style={{
                        width: cellWidth,
                        fontSize: 8,
                    }}
                >
                    {t(pointOfAttack + "." + attacker) === pointOfAttack + "." + attacker
                        ? ""
                        : t(pointOfAttack + "." + attacker + ".name")}
                </Text>
            ))}
        </View>
    );
};
