import { createRemoteJWKSet } from "jose";
import { env } from "../config/env.js";

export const JWKS = createRemoteJWKSet(
  new URL(`${env.CLIENT_URL}/api/auth/jwks`),
);
