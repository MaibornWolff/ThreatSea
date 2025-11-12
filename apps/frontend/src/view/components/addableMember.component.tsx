/**
 * @module addableMember.component Defines the view of the dialog
 *     to add arbitrary members.
 */

import CheckIcon from "@mui/icons-material/Check";
import { Box, FormHelperText } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import type { ChangeEvent, JSX } from "react";
import { useLayoutEffect, useState } from "react";
import type {
    FieldErrors,
    FieldValues,
    Path,
    UseFormClearErrors,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { User } from "#api/types/members.types.ts";
import { useAddableMembersList } from "../../application/hooks/use-addableMember-list.hook";
import { SearchField } from "../components/search-field.component";

type BaseAddableMemberFormValues = FieldValues & {
    id: number | undefined;
    name?: string;
    email?: string;
};

interface AddableMemberForm<TFieldValues extends BaseAddableMemberFormValues> {
    register: UseFormRegister<TFieldValues>;
    setValue: UseFormSetValue<TFieldValues>;
    clearErrors: UseFormClearErrors<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
}

interface AddableMemberProps<TFieldValues extends BaseAddableMemberFormValues> {
    projectCatalogId: number;
    memberPath: string;
    form: AddableMemberForm<TFieldValues>;
}

interface ChosenMemberState {
    id: number;
    checkbox: HTMLElement;
}

/**
 * Component for the adding of addable members of a project.
 *
 * @param {number} projectCatalogId - id of the current project/catalogue.
 * @param {string} memberPath - URL path, either projects or catalogs.
 * @returns The add member component.
 */
export const AddableMember = <TFieldValues extends BaseAddableMemberFormValues>({
    projectCatalogId,
    memberPath,
    form,
}: AddableMemberProps<TFieldValues>): JSX.Element[] => {
    const DEFAULT_CHOSEN_MEMBERSTATE: ChosenMemberState = {
        id: -1,
        checkbox: document.createElement("div"), // Dummy to dodge an if case.
    };

    const { addableMembers, loadAddableMembers, setSearchValue } = useAddableMembersList();
    const [chosenMemberToAdd, setMemberToAdd] = useState<ChosenMemberState>(DEFAULT_CHOSEN_MEMBERSTATE);

    const { t } = useTranslation();

    useLayoutEffect(() => {
        loadAddableMembers(projectCatalogId, memberPath);
    }, [loadAddableMembers, memberPath, projectCatalogId]);

    /**
     * Sets the addable members properties and ui for error handling.
     *
     * @param {number} id - id of the current addable member.
     * @param {string} name - name of the addable member.
     */
    const setSelectedAddableMember = (id: User["id"], name: User["name"], email: User["email"]) => {
        chosenMemberToAdd.checkbox.style.display = "none";
        // @ts-expect-error Seems to be a known issue with react-hook-form and generics: https://github.com/react-hook-form/react-hook-form/issues/12828
        form.setValue("id" as Path<TFieldValues>, id);
        // @ts-expect-error Seems to be a known issue with react-hook-form and generics: https://github.com/react-hook-form/react-hook-form/issues/12828
        form.setValue("name" as Path<TFieldValues>, name);
        // @ts-expect-error Seems to be a known issue with react-hook-form and generics: https://github.com/react-hook-form/react-hook-form/issues/12828
        form.setValue("email" as Path<TFieldValues>, email);
        form.clearErrors("id" as Path<TFieldValues>);

        if (id !== chosenMemberToAdd.id) {
            const toCheck = document.getElementById(`icon-${id}`) as HTMLElement;
            const addableMemberList = document.getElementById("addableMemberList") as HTMLElement;

            toCheck.style.display = "block";
            addableMemberList.style.border = "";

            setMemberToAdd({
                id,
                checkbox: toCheck,
            });
        } else {
            setMemberToAdd(DEFAULT_CHOSEN_MEMBERSTATE);
        }
    };

    return [
        <SearchField
            key="addable-member-search"
            inputSx={{ width: "100%" }}
            data-testid="MemberAddableSearch"
            onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setSearchValue(event.target.value)
            }
        />,

        <Box
            key="addable-member-list"
            id={"addableMemberList"}
            sx={{
                margin: "20px 0px 15px 0px",
                width: "100%",
                borderRadius: 5,
                overflow: "hidden",
                height: "200px",
                boxShadow: `0px 2px 1px -1px rgb(0 0 0 / 20%),
                                0px 1px 1px 0px rgb(0 0 0 / 14%),
                                0px 1px 3px 0px rgb(0 0 0 / 12%)`,
            }}
        >
            <Box
                sx={{
                    maxHeight: "40vh",
                    height: "200px",
                    overflowY: "scroll",
                }}
            >
                <input
                    type={"hidden"}
                    value={""}
                    {...form.register("id" as Path<TFieldValues>, {
                        validate: () => {
                            if (chosenMemberToAdd.id !== DEFAULT_CHOSEN_MEMBERSTATE.id) {
                                return true;
                            } else {
                                const addableMemberList = document.getElementById("addableMemberList") as HTMLElement;

                                addableMemberList.style.border = "1px solid #d32f2f";

                                return t("errorMessages.memberRequired");
                            }
                        },
                    })}
                />
                <input type={"hidden"} value={""} {...form.register("name" as Path<TFieldValues>, {})} />
                <input type={"hidden"} value={""} {...form.register("email" as Path<TFieldValues>, {})} />
                <List
                    sx={{
                        width: "100%",
                        cursor: "pointer",
                        "& ul": { padding: 0 },
                        boxSizing: "border-box",
                        padding: 0,
                    }}
                    subheader={<li />}
                >
                    {addableMembers.map((addableMember: User) => {
                        const { id, name, email } = addableMember;

                        return (
                            <ListItem
                                key={id}
                                sx={{
                                    backgroundColor: "#FFFFFF",
                                    ":hover": {
                                        backgroundColor: "#f1f2f3",
                                    },
                                }}
                                onClick={() => setSelectedAddableMember(id, name, email)}
                            >
                                <ListItemText
                                    primary={name}
                                    primaryTypographyProps={{
                                        fontSize: "0.85em",
                                    }}
                                    secondary={email}
                                    secondaryTypographyProps={{
                                        color: "#5e666e",
                                        fontSize: "0.8em",
                                    }}
                                />
                                <CheckIcon
                                    id={`icon-${id}`}
                                    sx={{
                                        display: "none",
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </Box>,
        <FormHelperText
            key="form-helper-text"
            sx={{
                color: "text.formError",
                ml: 1.75,
            }}
        >
            {form.errors?.id?.message?.toString()}
        </FormHelperText>,
    ];
};
