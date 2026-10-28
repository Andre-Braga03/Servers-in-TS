const migrationConfig = {
    migrationsFolder: "src/db/migrations",
};
process.loadEnvFile();
export const config = {
    api: {
        fileserverHits: 0,
        port: Number(process.env.PORT),
    },
    db: {
        url: process.env.DB_URL ?? "",
        migrationConfig,
    },
};
export function getHits() {
    return config.api.fileserverHits;
}
export function middlewareMetricsInc(req, res, next) {
    config.api.fileserverHits++;
    next();
}
