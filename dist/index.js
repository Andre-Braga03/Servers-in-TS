import express from "express";
import { getHits, handlerResetMetrics, middlewareMetricsInc } from "./config.js";
const app = express();
const PORT = 8080;
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.get("/admin/reset", handlerResetMetrics);
app.use(middlewareLogResponses);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode < 200 || statusCode >= 300) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
        }
    });
    next();
}
function handlerReadiness(_req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
function handlerMetrics(_req, res) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${getHits()} times!</p>
  </body>
</html>`);
}
