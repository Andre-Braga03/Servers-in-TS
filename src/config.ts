import { Request, Response, NextFunction } from "express";

process.loadEnvFile();

type APIConfig = {
fileserverHits: number;
dbUrl: string;
};

export const config : APIConfig = {
  fileserverHits: 0,
  dbUrl: process.env.DB_URL ?? "",
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