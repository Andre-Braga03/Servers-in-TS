import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT } from "./auth.js";
import { hashPassword, checkPasswordHash , extractBearerToken} from "./auth.js";
import { BadRequestError } from "../error/APIErrors.js";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });


});


describe("extractBearerToken", () => {
  it("returns the token from a Bearer header", () => {
    const token = extractBearerToken("Bearer abc123");
    expect(token).toBe("abc123");
  });

  it("throws when the header is missing", () => {
    expect(() => extractBearerToken(undefined)).toThrow(BadRequestError);
    expect(() => extractBearerToken(undefined)).toThrow(
      "Authorization header is required",
    );
  });

  it("throws when the scheme is not Bearer", () => {
    expect(() => extractBearerToken("Basic abc123")).toThrow(BadRequestError);
    expect(() => extractBearerToken("Basic abc123")).toThrow(
      "Invalid authorization type",
    );
  });
});