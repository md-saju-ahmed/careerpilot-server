import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import { ApiError } from "./lib/ApiError.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );

  // Ensure a database connection exists before any request reaches a route.
  // connectDB() is idempotent, so repeated calls are safe in serverless environments.
  app.use(
    asyncHandler(async (_req, _res, next) => {
      await connectDB();
      next();
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  // Lightweight health check that does not depend on database availability.
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Global rate limiter for all API routes.
  const globalApiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new ApiError(
          429,
          "Too many requests. Please slow down and try again shortly.",
        ),
      );
    },
  });

  app.use("/api", globalApiLimiter);
  app.use("/api", routes);

  // Handle unmatched routes and application errors.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
