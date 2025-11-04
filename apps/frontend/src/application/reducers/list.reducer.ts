import { createReducer } from "@reduxjs/toolkit";
import { ListActions, type SortDirection } from "../actions/list.actions";

interface ListState {
    projects: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    assets: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    catalogs: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    catalogThreats: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    catalogMeasures: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    threats: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    measures: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    measureThreats: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: "threatName";
    };
    threatMeasures: {
        searchValue: string;
        sortDirection: "asc" | "desc";
        sortBy: "measureName";
    };
    addedMembers: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
    addableMembers: {
        searchValue: string;
        sortDirection: SortDirection;
        sortBy: string;
    };
}

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
    threatMeasures: {
        searchValue: "",
        sortDirection: "asc",
        sortBy: "measureName",
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
