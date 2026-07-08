import type { ComponentProps, ReactNode } from "react";
import { Page as PdfPage, View } from "@react-pdf/renderer";
import { s2, s5, s6 } from "#view/report/report.style.ts";
import { Text } from "./text.report.component";
import { colors } from "#view/wrappers/color-tokens.ts";

type PdfPageBaseProps = ComponentProps<typeof PdfPage>;
type PdfPageOptionalChildren = Omit<PdfPageBaseProps, "children">;

interface PageProps extends PdfPageOptionalChildren {
    logo?: string | undefined;
    projectName: string;
    date: string;
    confidentialityLevel: string;
    children: ReactNode;
}

type HeaderProps = Pick<PageProps, "projectName" | "date" | "logo"> & PdfPageOptionalChildren;

interface FooterProps {
    confidentialityLevel: string;
}

export const Page = ({ logo, projectName, date, children, confidentialityLevel, ...props }: PageProps) => {
    return (
        <PdfPage
            size="A4"
            style={{
                flexDirection: "column",
                alignItems: "stretch",
                backgroundColor: colors.surface.paperWhite,
                // Reserve vertical space for the fixed header/footer
                paddingTop: s6,
                paddingBottom: s5,
                paddingLeft: s6,
                paddingRight: s6,
            }}
            wrap
            {...props}
        >
            <Header logo={logo} projectName={projectName} date={date} {...props} />
            <View
                style={{
                    flexDirection: "column",
                    alignItems: "stretch",
                }}
            >
                {children}
            </View>
            <Footer confidentialityLevel={confidentialityLevel} />
        </PdfPage>
    );
};

const Header = ({ projectName, date }: HeaderProps) => {
    return (
        <View
            style={{
                position: "absolute",
                top: s2,
                left: s6,
                right: s6,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
            }}
            fixed
        >
            <Text style={{ fontSize: 10 }}>{projectName} | Report</Text>
            <Text style={{ fontSize: 10 }}>{date}</Text>
        </View>
    );
};

const Footer = ({ confidentialityLevel }: FooterProps) => {
    return (
        <View
            style={{
                position: "absolute",
                bottom: s2,
                left: s6,
                right: s6,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            fixed
        >
            <Text size="small" style={{ fontStyle: "italic" }}>
                {confidentialityLevel}
            </Text>

            <Text
                size="small"
                render={(props) => {
                    return props.pageNumber;
                }}
            />
        </View>
    );
};
