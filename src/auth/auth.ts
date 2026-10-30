import { randomBytes } from "node:crypto";
import type { Request } from "express";
import argon2 from "argon2";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { UnauthorizedError, BadRequestError } from "../error/APIErrors.js";


type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string>{
   try{
     const hash = await argon2.hash(password)
     return hash;
    } catch (error) {
      throw new Error("Failed to hash password");
    }
}

export async function checkPasswordHash(password:string, hash:string) : Promise<boolean>{
    try{
        const isValid = await argon2.verify(hash, password)
        if(isValid){
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error("Failed to verify password");
    }
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const tokenPayload: payload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(tokenPayload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  let decoded: JwtPayload;
  try {
    const verified = jwt.verify(tokenString, secret);
    if (typeof verified === "string") {
      throw new UnauthorizedError("Invalid token");
    }
    decoded = verified;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Invalid token");
  }

  if (!decoded.sub) {
    throw new UnauthorizedError("Invalid token");
  }

  return decoded.sub;
}

export function extractBearerToken(authrozation: string | undefined): string {
  if(!authrozation){
    throw new BadRequestError("Authorization header is required");
  }
  const [type, token] = authrozation.split(" ");
  if(type !== "Bearer"){
    throw new BadRequestError("Invalid authorization type");
  }
  return token;
}

export function getBearerToken(req: Request): string {
  return extractBearerToken(req.get("Authorization"));
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function getAPIKey(req: Request) {
  const apiKey = req.get("Authorization");
  if(!apiKey){
    throw new BadRequestError("API key is required");
  }
  const list = apiKey.split(" ");

  
  return list[list.length - 1];
}

