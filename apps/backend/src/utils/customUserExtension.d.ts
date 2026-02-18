declare namespace Express {
    interface User {
        id?: number;
        threatSeaToken?: string;
    }

    interface Request {
        user?: {
            id: number;
        };
    }
}
