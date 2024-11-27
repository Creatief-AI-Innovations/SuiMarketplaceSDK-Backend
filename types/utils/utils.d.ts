import { NextFunction, Request, Response } from 'express';
export declare const formatJSONResponse: (response: Record<string, unknown>) => {
    statusCode: number;
    body: string;
};
export declare const verifyApi: (req: Request, res: Response, next: NextFunction) => void;
export declare const verifyUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const hashedPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare function createSUIWallet(): Promise<{
    public: string;
    private: string;
}>;
//# sourceMappingURL=utils.d.ts.map