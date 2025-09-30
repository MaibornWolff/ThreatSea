/**
 * @module list.reducer - Defines the reducer for
 *     the listings.
 */

import { createReducer } from "@reduxjs/toolkit";
import { ListActions } from "../actions/list.actions";

interface ListState {
    projects: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    assets: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    catalogs: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    catalogThreats: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    catalogMeasures: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    threats: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    measures: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    measureThreats: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: "threatName";
    };
    addedMembers: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
    addableMembers: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: string;
    };
}

/**
 * Initial state of the listings filter/sorting.
 *
 * Defines for each categorie the same search criteria.
 * @type {object} nameSpace - Holds the search criteria for the given list.
 *     @type {string} searchValue - The value to search/filter with.
 *     @type {string} sortDirection - The direction the list shall be sorted => asc/desc.
 *     @type {string} sortBy - The attribute we sort by.
 */
const defaultState: ListState = {
    projects: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    assets: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    catalogs: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    catalogThreats: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    catalogMeasures: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    threats: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    measures: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    measureThreats: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "threatName",
    },
    addedMembers: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "name",
    },
    addableMembers: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "",
    },
};

/**
 * The ListReducer updates the current state based on incoming actions.
 * @function listReducer
 */
export const listReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ListActions.setSearchValue, (state, action) => {
        const {
            payload: { nameSpace, searchValue },
        } = action;
        state[nameSpace].searchValue = searchValue;
    });

    builder.addCase(ListActions.setSortBy, (state, action) => {
        const {
            payload: { nameSpace, sortBy },
        } = action;
        state[nameSpace].sortBy = sortBy;
    });

    builder.addCase(ListActions.setSortDirection, (state, action) => {
        const {
            payload: { nameSpace, sortDirection },
        } = action;
        state[nameSpace].sortDirection = sortDirection;
    });
});
