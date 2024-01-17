import { Request, Response, NextFunction } from "express";
import { JWTVerifyOptions, JWTVerifyGetKey, jwtVerify } from "jose";
export interface AuthOptions {
  verify: JWTVerifyOptions;
  key: JWTVerifyGetKey;
}

function extractToken(req: Request) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

export const checkJwt =
  ({ key, verify }: AuthOptions) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token || typeof token !== "string") {
      res.send(401);
      return;
    }

    try {
      const { payload } = await jwtVerify(token, key, verify);
      req.auth = { token, payload };
      next();
    } catch (e) {
      res.send(401);
    }
  };
