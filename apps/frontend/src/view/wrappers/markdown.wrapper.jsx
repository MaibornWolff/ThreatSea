import { useEffect, useState } from "react";
import { AlertActions } from "../../application/actions/alert.actions";
import { useAppDispatch } from "../../application/hooks/use-app-redux.hook";

export const useGetMarkdownText = (language, filename) => {
    const [markdownText, setMarkdownText] = useState("");
    const dispatch = useAppDispatch();

    useEffect(() => {
        fetch(filename)
            .then((res) => {
                if (res.headers.get("content-type").includes("text/markdown")) {
                    return res.text();
                } else {
                    dispatch(
                        AlertActions.openErrorAlert({
                            text: `${filename} could not be loaded`,
                        })
                    );
                    return `Error: ${filename} could not be loaded`;
                }
            })
            .then((md) => {
                setMarkdownText(md);
            });
    }, [filename, dispatch, language]);
    return {
        markdownText,
    };
};
