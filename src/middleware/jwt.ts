import { Handler } from "express";
import { AuthOptions, auth } from "express-oauth2-jwt-bearer";

export const checkJwt: (authOpts: AuthOptions) => Handler = (authOpts) =>
  auth({
    ...authOpts,
    validators: {
      sub: (value) => typeof value === "string" && value.length > 0,
    },
  });
