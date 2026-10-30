import express, { NextFunction, ErrorRequestHandler } from "express";
import { Request, Response } from "express";
import { getHits, middlewareMetricsInc } from "./config.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ApiError } from "./error/APIErrors.js";
import { config } from "./config.js";
import { createUser, resetUsers, getUserByEmail, updateUser, updateUserIsChirpyRed, getUserById } from "./db/queries/users.js";
import { createChirp, getAllChirps, getChirpById, resetChirps, deleteChirpById, getAllChirpsByUserId, getAllChirpsSortedByCreatedAtAsc, getAllChirpsSortedByCreatedAtDesc } from "./db/queries/chirps.js";
import { hashPassword, checkPasswordHash, makeJWT, getBearerToken, validateJWT, makeRefreshToken, getAPIKey} from "./auth/auth.js";
import { createRefreshToken, getUserByRefreshToken, resetRefreshTokens, revokeRefreshToken } from "./db/queries/tokens.js";
const app = express();
const Middleware = express.json();

const middlewareErrorHandler : ErrorRequestHandler = (err, req, res, next) => {
  if(err instanceof ApiError){
    res.status(err.statusCode).json({
      error: err.message
    });
    return;
  }
}
type middlewareLogResponses = (req: Request, res: Response, next: NextFunction) => void;


app.use("/app",middlewareMetricsInc, express.static("./src/app"));
app.use(Middleware);

// GET Requests
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics",handlerMetrics);
app.get("/api/chirps/", handlerGetAllChirps);
app.get("/api/chirps/:id", handlerGetChirpById);
// POST Requests
app.post("/admin/reset", handlerResetMetrics);
app.post("/api/users", handlerCreateUser);
app.post("/api/chirps", handlerValidateChirp);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);
app.post("/api/polka/webhooks", handlerPolkaWebhooks);

// PUT Requests
app.put("/api/users", handlerUpdateUser);

// DELETE Requests
app.delete("/api/chirps/:chirpId", handlerDeleteChirp);



// Middleware
app.use(middlewareLogResponses);
app.use(middlewareErrorHandler);

app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});


function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
  res.on("finish",() =>{
    const statusCode = res.statusCode;
    if(statusCode < 200 || statusCode >= 300 ){
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
    }
  });
  next();
}

function handlerReadiness(_req: Request, res: Response) {
res.set("Content-Type", "text/plain; charset=utf-8"); 
 res.send("OK");
}

function handlerMetrics(_req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${getHits()} times!</p>
  </body>
</html>`);
}

async function handlerValidateChirp(req: Request, res: Response) {
    const parsed = req.body;
    if( typeof parsed.body !== "string"){
      res.status(400).json({
        error: "Something went wrong"
      });
      return;
    }
  
    if(parsed.body.length > 140){
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    const badwords = ["kerfuffle", "sharbert", "fornax"];
    const cleanedBody = parsed.body
    .split(" ")
    .map((word : string) =>
      badwords.includes(word.toLowerCase()) ? "****" : word
    ).join(" ");
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



    async function handlerResetMetrics(_req: Request, res: Response) {
      if(process.env.PLATFORM !== "dev"){
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
    async function handlerCreateUser(req: Request, res: Response) {
      const parsed = req.body;
      if(typeof parsed.email !== "string" ){
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
        isChirpyRed: user.is_chirpy_red,
      });
    }

    async function handlerGetAllChirps(req: Request, res: Response) {
      const authorIdQuery = req.query.authorId;
      const sortQuery = req.query.sort;
    
      const chirps =
        typeof authorIdQuery === "string" && authorIdQuery !== ""
          ? await getAllChirpsByUserId(authorIdQuery)
          : await getAllChirps();
    
      chirps.sort((a, b) => {
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        return sortQuery === "desc" ? bTime - aTime : aTime - bTime;
      });
    
      res.status(200).json(chirps);
    }

    async function handlerGetChirpById(req: Request, res: Response) {
      const chirp = await getChirpById(req.params.id as string);
      if (!chirp) {
        throw new NotFoundError("Chirp not found.");
      }
      res.status(200).json(chirp);
    }

    async function handlerLogin(req: Request, res: Response) {
      const parsed = req.body;
      if(typeof parsed.email !== "string" || typeof parsed.password !== "string"){
        throw new BadRequestError("Invalid email or password.");
      }
      const user = await getUserByEmail(parsed.email);
      if(!user){
        throw new NotFoundError("User not found.");
      }
      const isValid = await checkPasswordHash(parsed.password, user.hashed_password);
      if(!isValid){
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
        isChirpyRed: user.is_chirpy_red,
      });
    }

    async function handlerRefresh(req: Request, res: Response) {
      const refreshToken = getBearerToken(req);
      const user = await getUserByRefreshToken(refreshToken);
      if(!user){
        throw new UnauthorizedError("Invalid refresh token.");
      }
      const token = makeJWT(user, 60 * 60, config.api.jwtSecret);
      res.status(200).json({ token });
    }

    async function handlerRevoke(req: Request, res: Response) {
      const refreshToken = getBearerToken(req);
      const now = new Date();
      await revokeRefreshToken(refreshToken, now);
      res.status(204).send();
    }

    async function handlerUpdateUser(req: Request, res: Response) {
      const parsed = req.body;
      if(typeof parsed.email !== "string" || typeof parsed.password !== "string"){
       throw new BadRequestError("Invalid email or password.");
      }
      let token : string;
      try {
        token = getBearerToken(req);
      } catch (error) {
        throw new UnauthorizedError("Invalid token.");
      }
      const userId = validateJWT(token, config.api.jwtSecret);
      const passwordHash = await hashPassword(parsed.password);
      const user = await updateUser(userId, {
        email: parsed.email,
        hashed_password: passwordHash,
      });
      res.status(200).json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.is_chirpy_red,
      });
    }

    async function handlerDeleteChirp(req: Request, res: Response) {
      const parsed = req.params;
      if(typeof parsed.chirpId !== "string"){
        throw new BadRequestError("Invalid chirp ID.");
      }

      let token : string;
      try {
        token = getBearerToken(req);
      } catch (error) {
        throw new UnauthorizedError("Invalid token.");
      }
      const userId = validateJWT(token, config.api.jwtSecret);
      const chirp = await getChirpById(parsed.chirpId);
      if(!chirp){
        throw new NotFoundError("Chirp not found.");
      }
      if(chirp.userId !== userId){
        throw new ForbiddenError("You are not allowed to delete this chirp.");
      }
      await deleteChirpById(parsed.chirpId);
      res.status(204).send();
    }

    async function handlerPolkaWebhooks(req: Request, res: Response) {
      const parser = req.body;
      if(parser.event !== "user.upgraded"){
        res.status(204).send();
        return;
      }
      let apiKey : string;
      try {
        apiKey = getAPIKey(req);
      } catch (error) {
        throw new UnauthorizedError("Invalid API key.");
      }
      if(apiKey !== config.api.polkaKey){
        throw new UnauthorizedError("Invalid API key.");
      }
      if(typeof parser.data?.userId !== "string"){
        throw new BadRequestError("Invalid user ID.");
      }

      const user = await getUserById(parser.data.userId);
      if(!user){
        throw new NotFoundError("User not found.");
      }
      
      await updateUserIsChirpyRed(parser.data.userId);
      res.status(204).send();
    
    }