import "express-session";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
            };
        }
    }
}

declare module "express-session" {
    interface SessionData {
        oidc?: {
            state: string;
            nonce: string;
            codeVerifier: string;
        };
    }
}
