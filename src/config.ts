import { Request, Response, NextFunction } from "express";
import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "src/db/migrations",
}

process.loadEnvFile();

type APIConfig = {
fileserverHits: number;
port: number;
};

type DBConfig = {
    url: string;
    migrationConfig: MigrationConfig;
}

type Config = {
    api: APIConfig;
    db: DBConfig;
}
export const config : Config = {
 api: {
    fileserverHits: 0,
    port: Number(process.env.PORT),
 },
 db: {
    url: process.env.DB_URL ?? "",
    migrationConfig,
 },
};


export function getHits(): number {
    return config.api.fileserverHits;
}
export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    config.api.fileserverHits++;
    next();
}

