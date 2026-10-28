import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { getHits, handlerResetMetrics, middlewareMetricsInc } from "./config.js";
const app = express();
const PORT = 8080;
const Middleware = express.json();
type middlewareLogResponses = (req: Request, res: Response, next: NextFunction) => void;


app.use("/app",middlewareMetricsInc, express.static("./src/app"));

// GET Requests
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics",handlerMetrics);

// POST Requests
app.post("/admin/reset", handlerResetMetrics);
app.post("/api/validate_chirp", Middleware, handlerValidateChirp);

// Middleware
app.use(middlewareLogResponses);

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

function handlerValidateChirp(req: Request, res: Response) {
    const parsed = req.body;

    if( typeof parsed.body !== "string"){
      res.header("Content-Type", "application/json");
      const bodyy = JSON.stringify({
        error: "Something went wrong",
      });
      res.status(400).send(bodyy);
      return;
    }

    if(parsed.body.length > 140){
      res.header("Content-Type", "application/json");
      const bodyy = JSON.stringify({
        error: "Chirp is too long",
      });
      res.status(400).send(bodyy);
      return;
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
  

