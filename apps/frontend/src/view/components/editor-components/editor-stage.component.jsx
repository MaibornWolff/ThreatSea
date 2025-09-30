import { Box } from "@mui/material";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { Stage } from "react-konva";
import { useDispatch } from "react-redux";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { EditorActions } from "../../../application/actions/editor.actions";
import { EditorContextMenu } from "./editor-context-menu.component";

const scaleBy = 1.025;

const EditorStageInner = (
    {
        children,
        onContextMenuOpen,
        onContextMenuAction,
        onClick,
        handleMouseDown,
        handleMouseMove,
        onTouchMove,
        handleMouseUp,
        onMouseLeave,
        onKeyUp,
        layerPosition,
        onScale,
        scale,
        position,
        userRole,
    },
    stageRef
) => {
    const contextMenuRef = useRef();
    const boxRef = useRef();
    const dispatch = useDispatch();

    const onWheel = useCallback(
        (e) => {
            e.evt.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;

            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
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
        ({ evt }) => {
            evt.preventDefault();
            const stage = stageRef.current;
            const contextMenu = contextMenuRef.current;
            if (!stage || !contextMenu) return;

            let { x, y } = stage.getPointerPosition();

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
        (e) => {
            if (e.evt.button === 0) {
                dispatch(EditorActions.setOpenContextMenu(false));
                onClick(e);
            }
        },
        [dispatch, onClick]
    );

    const handleClickAction = useCallback(
        (component) => {
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
                onDragOver={(e) => e.evt.preventDefault()}
                onContextMenu={checkUserRole(userRole, USER_ROLES.EDITOR) ? handleOpenContextMenu : null}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onTouchMove={onTouchMove}
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

export const EditorStage = forwardRef(EditorStageInner);
