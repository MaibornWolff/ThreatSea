import { Box } from "@mui/material";
import { useCallback, useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { Stage } from "react-konva";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { EditorActions } from "../../../application/actions/editor.actions";
import { EditorContextMenu } from "./editor-context-menu.component";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import type { Coordinate } from "#api/types/system.types.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";

interface EditorStageProps {
    children: ReactNode;
    onContextMenuOpen: () => void;
    onContextMenuAction: (component: EditorComponentType) => void;
    onClick?: (event: KonvaEventObject<MouseEvent>) => void;
    handleMouseDown: (event: KonvaEventObject<MouseEvent>) => void;
    handleMouseMove: (event: KonvaEventObject<MouseEvent>) => void;
    handleMouseUp: (event: KonvaEventObject<MouseEvent>) => void;
    onMouseLeave: (event: KonvaEventObject<MouseEvent>) => void;
    onKeyUp: (event: KeyboardEvent) => void;
    onScale: (scale: number, position: Coordinate) => void;
    scale: number;
    position: Coordinate;
    userRole: USER_ROLES | undefined;
    mousePointers?: unknown;
    ref?: Ref<KonvaStage>;
}

const scaleBy = 1.025;

export const EditorStage = ({
    children,
    onContextMenuOpen,
    onContextMenuAction,
    onClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    onMouseLeave,
    onKeyUp,
    onScale,
    scale,
    position,
    userRole,
    ref,
}: EditorStageProps) => {
    const stageRef = useRef<KonvaStage | null>(null);
    useImperativeHandle(ref, () => stageRef.current!);
    const contextMenuRef = useRef<HTMLDivElement | null>(null);
    const boxRef = useRef<HTMLDivElement | null>(null);
    const dispatch = useAppDispatch();

    const onWheel = useCallback(
        (event: KonvaEventObject<WheelEvent>) => {
            event.evt.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const oldScale = stage.scaleX();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            let newScale = event.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            newScale = Math.min(5, Math.max(newScale, 0.5));

            stage.scale({ x: newScale, y: newScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            stage.position(newPos);
            onScale(newScale, newPos);
        },
        [stageRef, onScale]
    );

    const handleOpenContextMenu = useCallback(
        (event: KonvaEventObject<PointerEvent>) => {
            event.evt.preventDefault();
            const stage = stageRef.current;
            const contextMenu = contextMenuRef.current;
            if (!stage || !contextMenu) return;

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            let { x, y } = pointer;

            if (x + contextMenu.clientWidth >= stage.width()) {
                x -= Math.abs(stage.width() - (x + contextMenu.clientWidth));
                x -= 20;
            }

            if (y + contextMenu.clientHeight >= stage.height()) {
                y -= Math.abs(stage.height() - (y + contextMenu.clientHeight));
                y -= 20;
            }

            contextMenu.style.left = x + "px";
            contextMenu.style.top = y + "px";
            dispatch(EditorActions.setOpenContextMenu(true));
            onContextMenuOpen();
        },
        [stageRef, dispatch, onContextMenuOpen]
    );

    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            if (event.evt.button === 0) {
                dispatch(EditorActions.setOpenContextMenu(false));
                onClick?.(event);
            }
        },
        [dispatch, onClick]
    );

    const handleClickAction = useCallback(
        (component: EditorComponentType) => {
            dispatch(EditorActions.setOpenContextMenu(false));
            onContextMenuAction(component);
        },
        [dispatch, onContextMenuAction]
    );

    useEffect(() => {
        const box = boxRef.current;
        const stage = stageRef.current;
        if (!box || !stage) return;

        const resizeObserver = new ResizeObserver(() => {
            stage.width(box.clientWidth);
            stage.height(box.clientHeight);
        });

        resizeObserver.observe(box);

        // Initial size
        stage.width(box.clientWidth);
        stage.height(box.clientHeight);

        return () => resizeObserver.disconnect();
    }, [stageRef]);

    useEffect(() => {
        window.onkeyup = onKeyUp;
        return () => {
            window.onkeyup = null;
        };
    }, [onKeyUp]);

    useEffect(() => {
        const stage = stageRef.current;
        if (stage) {
            stage.scale({ x: scale, y: scale });
            stage.position({ x: position.x, y: position.y });
            stage.batchDraw();
        }
    }, [stageRef, scale, position]);

    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                margin: "auto 0",
            }}
            ref={boxRef}
            data-testid="EditorPage"
        >
            <Stage
                ref={stageRef}
                perfectDrawEnabled={false}
                listening={true}
                shadowForStrokeEnabled={false}
                onWheel={onWheel}
                onDragOver={(event: KonvaEventObject<DragEvent>) => event.evt.preventDefault()}
                onContextMenu={
                    checkUserRole(userRole, USER_ROLES.EDITOR)
                        ? handleOpenContextMenu
                        : () => {
                              return;
                          }
                }
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={onMouseLeave}
                onClick={handleClick}
            >
                {children}
            </Stage>
            <EditorContextMenu ref={contextMenuRef} stageRef={stageRef} onSelect={handleClickAction} />
        </Box>
    );
};

EditorStage.displayName = "EditorStage";
