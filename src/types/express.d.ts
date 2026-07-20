import express from "express";
import type { Role } from "../lib/roles.js";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  status?: string;
  image?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
