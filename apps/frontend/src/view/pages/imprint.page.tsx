import { Box } from "@mui/system";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import Markdown from "markdown-to-jsx";
import { useGetMarkdownText } from "../wrappers/markdown.wrapper";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";

/**
 * on this page all projects are listed
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const ImprintPageBody = () => {
    const {
        i18n: { language },
    } = useTranslation();
    const filename = "./imprint_" + language + ".md";
    const { markdownText: imprintText } = useGetMarkdownText(language, filename);

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
                    <Markdown>{imprintText}</Markdown>
                </div>
            </Page>
        </Box>
    );
};

export const ImprintPage = CreatePage(HeaderNavigation, ImprintPageBody);
