import { Request, Response, NextFunction } from "express";

type APIConfig = {
fileserverHits: number;
};

const config : APIConfig = {
  fileserverHits: 0,
}

export function getHits(): number {
    return config.fileserverHits;
}
export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    config.fileserverHits++;
    next();
}

export function handlerResetMetrics(_req: Request, res: Response) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}