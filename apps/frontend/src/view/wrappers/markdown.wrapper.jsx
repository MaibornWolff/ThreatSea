import { useEffect, useState } from "react";
import { AlertActions } from "../../application/actions/alert.actions";
import { useDispatch } from "react-redux";

export const useGetMarkdownText = (language, filename) => {
    const [markdownText, setMarkdownText] = useState("");
    const dispatch = useDispatch();

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
