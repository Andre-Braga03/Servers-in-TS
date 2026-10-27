const config = {
    fileserverHits: 0,
};
export function getHits() {
    return config.fileserverHits;
}
export function middlewareMetricsInc(req, res, next) {
    config.fileserverHits++;
    next();
}
export function handlerResetMetrics(_req, res) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
