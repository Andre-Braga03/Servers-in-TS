import express from "express";
import { getHits, middlewareMetricsInc } from "./config.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ApiError } from "./error/APIErrors.js";
import { config } from "./config.js";
import { createUser, resetUsers, getUserByEmail } from "./db/queries/users.js";
import { createChirp, getAllChirps, getChirpById, resetChirps } from "./db/queries/chirps.js";
import { hashPassword, checkPasswordHash, makeJWT, getBearerToken, validateJWT, makeRefreshToken } from "./auth/auth.js";
import { createRefreshToken, getUserByRefreshToken, resetRefreshTokens, revokeRefreshToken } from "./db/queries/tokens.js";
const app = express();
const Middleware = express.json();
const middlewareErrorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            error: err.message
        });
        return;
    }
};
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(Middleware);
// GET Requests
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.get("/api/chirps", handlerGetAllChirps);
app.get("/api/chirps/:id", handlerGetChirpById);
// POST Requests
app.post("/admin/reset", handlerResetMetrics);
app.post("/api/users", handlerCreateUser);
app.post("/api/chirps", handlerValidateChirp);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
// Middleware
app.use(middlewareLogResponses);
app.use(middlewareErrorHandler);
app.listen(config.api.port, () => {
    console.log(`Server is running at http://localhost:${config.api.port}`);
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
async function handlerValidateChirp(req, res) {
    const parsed = req.body;
    if (typeof parsed.body !== "string") {
        res.status(400).json({
            error: "Something went wrong"
        });
        return;
    }
    if (parsed.body.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    const badwords = ["kerfuffle", "sharbert", "fornax"];
    const cleanedBody = parsed.body
        .split(" ")
        .map((word) => badwords.includes(word.toLowerCase()) ? "****" : word).join(" ");
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.api.jwtSecret);
    const chirp = await createChirp({
        body: cleanedBody,
        userId,
    });
    res.header("Content-Type", "application/json");
    res.status(201).json(chirp);
    return;
}
async function handlerResetMetrics(_req, res) {
    if (process.env.PLATFORM !== "dev") {
        throw new ForbiddenError("Not allowed to reset metrics.");
    }
    await resetChirps();
    await resetRefreshTokens();
    await resetUsers();
    config.api.fileserverHits = 0;
    res.status(200).json({
        message: "OK",
    });
}
async function handlerCreateUser(req, res) {
    const parsed = req.body;
    if (typeof parsed.email !== "string") {
        throw new BadRequestError("Invalid email.");
    }
    const user = await createUser({
        email: parsed.email,
        hashed_password: await hashPassword(parsed.password),
    });
    res.status(201).json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });
}
async function handlerGetAllChirps(_req, res) {
    const chirps = await getAllChirps();
    res.status(200).json(chirps);
}
async function handlerGetChirpById(req, res) {
    const chirp = await getChirpById(req.params.id);
    if (!chirp) {
        throw new NotFoundError("Chirp not found.");
    }
    res.status(200).json(chirp);
}
async function handlerLogin(req, res) {
    const parsed = req.body;
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") {
        throw new BadRequestError("Invalid email or password.");
    }
    const user = await getUserByEmail(parsed.email);
    if (!user) {
        throw new NotFoundError("User not found.");
    }
    const isValid = await checkPasswordHash(parsed.password, user.hashed_password);
    if (!isValid) {
        throw new UnauthorizedError("Invalid password.");
    }
    const token = makeJWT(user.id, 60 * 60, config.api.jwtSecret);
    const refreshToken = makeRefreshToken();
    await createRefreshToken({
        token: refreshToken,
        user_id: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });
    res.status(200).json({
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
        token,
        refreshToken,
    });
}
async function handlerRefresh(req, res) {
    const refreshToken = getBearerToken(req);
    const user = await getUserByRefreshToken(refreshToken);
    if (!user) {
        throw new UnauthorizedError("Invalid refresh token.");
    }
    const token = makeJWT(user, 60 * 60, config.api.jwtSecret);
    res.status(200).json({ token });
}
async function handlerRevoke(req, res) {
    const refreshToken = getBearerToken(req);
    const now = new Date();
    await revokeRefreshToken(refreshToken, now);
    res.status(204).send();
}
