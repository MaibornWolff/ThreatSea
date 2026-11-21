import { Box } from "@mui/material";
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type RefObject, type Ref } from "react";
import type { Stage } from "konva/lib/Stage";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { EditorComponentList } from "./editor-component-list.component";

let opened = {
    x: 0,
    y: 0,
};

interface EditorContextMenuProps {
    onSelect: (component: EditorComponentType) => void;
    stageRef: RefObject<Stage | null>;
    ref?: Ref<HTMLDivElement>;
}

export const EditorContextMenu = ({ onSelect, stageRef, ref }: EditorContextMenuProps) => {
    const dispatch = useAppDispatch();
    const open = useAppSelector((state) => state.editor.openContextMenu);
    const [openCustomComponents, setOpenCustomComponents] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => contextMenuRef.current!);

    const setOpenCustomComponentsEvent = useEffectEvent((isOpen: boolean) => {
        setOpenCustomComponents(isOpen);
    });

    const handleOnContextMenuLoad = () => {
        if (contextMenuRef.current == null) {
            return;
        }
        new ResizeObserver(() => {
            const stage = stageRef.current;
            const contextMenu = contextMenuRef.current;
            let y = opened?.y;

            if (typeof y === "number" && stage && contextMenu) {
                if (y + contextMenu.clientHeight >= stage.height()) {
                    y -= Math.abs(stage.height() - (y + contextMenu.clientHeight));
                    y -= 20;
                }
                contextMenu.style.top = y + "px";
            }
        }).observe(contextMenuRef.current);
    };

    useEffect(() => {
        if (!open) {
            setOpenCustomComponentsEvent(false);
        } else {
            const stage = stageRef.current;
            if (stage) {
                const pointer = stage.getPointerPosition();
                if (pointer) {
                    opened = { x: pointer.x, y: pointer.y };
                }
            }
        }
    }, [open, stageRef]);

    return (
        <Box
            ref={contextMenuRef}
            sx={{
                position: "absolute",
                zIndex: 1000,
                bgcolor: "background.contextMenu",
                boxShadow: 4,
                visibility: open ? "initial" : "hidden",
                borderRadius: 4,
                paddingTop: 1,
                paddingBottom: 1,
                overflow: "hidden",
            }}
            onLoad={handleOnContextMenuLoad}
            data-testid="context-menu"
        >
            <EditorComponentList
                onSelect={onSelect}
                showCustomComponents={openCustomComponents}
                onToggleCustomComponents={() => setOpenCustomComponents((previous) => !previous)}
                onNavigateAway={() => dispatch(EditorActions.setOpenContextMenu(false))}
            />
        </Box>
    );
};

EditorContextMenu.displayName = "EditorContextMenu";
