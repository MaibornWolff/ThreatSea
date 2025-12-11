import type { ComponentProps, ReactNode } from "react";
import { Page as PdfPage, View } from "@react-pdf/renderer";
import { s2, s3, s6 } from "../report.style";
import { Text } from "./text.report.component";

type PdfPageBaseProps = ComponentProps<typeof PdfPage>;
type PdfPageOptionalChildren = Omit<PdfPageBaseProps, "children">;

export interface PageProps extends PdfPageOptionalChildren {
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
                justifyContent: "space-between",
                backgroundColor: "#ffffff",
                padding: s2,
                paddingLeft: s6,
                paddingRight: s6,
                height: "100%",
            }}
            wrap
            {...props}
        >
            <Header logo={logo} projectName={projectName} date={date} {...props} />
            <View
                style={{
                    flex: 1,
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
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: s3,
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
