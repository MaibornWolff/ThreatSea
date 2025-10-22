import { createReducer } from "@reduxjs/toolkit";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { CatalogsActions } from "../actions/catalogs.actions";
import { catalogsAdapter } from "../adapters/catalogs.adapter";

type CatalogsAdapterState = ReturnType<typeof catalogsAdapter.getInitialState>;

export type CatalogsState = CatalogsAdapterState & {
    isPending: boolean;
    current: CatalogWithRole | undefined;
};

const defaultState: CatalogsState = {
    ...catalogsAdapter.getInitialState(),
    isPending: false,
    current: undefined,
};

const catalogsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(CatalogsActions.getCatalogs.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.getCatalogs.fulfilled, (state, action) => {
        catalogsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogs.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.fulfilled, (state, action) => {
        state.current = action.payload;
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.createCatalog.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.createCatalog.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromRedux, (state, action) => {
        state.current = state.entities[action.payload];
    });

    builder.addCase(CatalogsActions.setCatalog, (state, action) => {
        action.payload.role = USER_ROLES.OWNER;

        catalogsAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.removeCatalog, (state, action) => {
        catalogsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.changeOwnCatalogRole, (state, action) => {
        const role = action.payload;
        const id = state.current?.id;

        if (id && state.entities[id]) state.entities[id].role = role;

        if (state.current) state.current.role = role;
    });
});

export default catalogsReducer;
