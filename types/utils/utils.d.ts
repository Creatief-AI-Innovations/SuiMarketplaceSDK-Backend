import { NextFunction, Request, Response } from 'express';
export declare const formatJSONResponse: (response: Record<string, unknown>) => {
    statusCode: number;
    body: string;
};
export declare const verifyApi: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=utils.d.ts.map