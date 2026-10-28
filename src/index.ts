import express, { NextFunction, ErrorRequestHandler } from "express";
import { Request, Response } from "express";
import { getHits, handlerResetMetrics, middlewareMetricsInc } from "./config.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ApiError } from "./error/APIErrors.js";
const app = express();
const PORT = 8080;
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

// POST Requests
app.post("/admin/reset", handlerResetMetrics);
app.post("/api/validate_chirp", handlerValidateChirp);

// Middleware
app.use(middlewareLogResponses);
app.use(middlewareErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
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

    res.header("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({
     cleanedBody: cleanedBody,
    }));
    return;
    }


