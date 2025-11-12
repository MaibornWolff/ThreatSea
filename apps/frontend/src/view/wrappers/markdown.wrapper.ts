import { useEffect, useState } from "react";
import { AlertActions } from "../../application/actions/alert.actions";
import { useAppDispatch } from "../../application/hooks/use-app-redux.hook";

interface UseGetMarkdownTextResult {
    markdownText: string;
}

export const useGetMarkdownText = (language: string, filename: string): UseGetMarkdownTextResult => {
    const [markdownText, setMarkdownText] = useState<string>("");
    const dispatch = useAppDispatch();

    useEffect(() => {
        fetch(filename)
            .then((res) => {
                if (res.headers.get("content-type")?.includes("text/markdown")) {
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
