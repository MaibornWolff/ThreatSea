import { Box } from "@mui/system";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { useGetMarkdownText } from "../wrappers/markdown.wrapper";
import Markdown from "markdown-to-jsx";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";

/**
 * on this page all projects are listed
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const PrivacyPolicyPageBody = () => {
    const {
        i18n: { language },
    } = useTranslation();
    const filename = "./privacyPolicy_" + language + ".md";
    const { markdownText: privacyPolicyText } = useGetMarkdownText(language, filename);

    const dispatch = useAppDispatch();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: false,
                showUniversalHeaderNavigation: true,
                showProjectInfo: false,
                getCatalogInfo: false,
            })
        );
    }, [dispatch]);

    return (
        <Box sx={{ overflow: "scroll" }}>
            <Page
                sx={{
                    paddingTop: 5,
                    paddingBottom: 4,
                    boxSizing: "border-box",
                }}
            >
                <div>
                    <Markdown>{privacyPolicyText}</Markdown>
                </div>
            </Page>
        </Box>
    );
};

export const PrivacyPolicyPage = CreatePage(HeaderNavigation, PrivacyPolicyPageBody);
