import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

import "./database";
// eslint-disable-next-line import/no-extraneous-dependencies
import sanitizePath from "sanitize-filename";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import { logger } from "./utils/logger";

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

// Middleware para verificar y convertir .ogg a .mp3
// eslint-disable-next-line consistent-return
app.use("/public", async (req, res, next) => {
  // Sanitize the incoming request path to remove any illegal characters or traversal attempts
  const sanitizedPath = sanitizePath(req.path);

  if (path.extname(sanitizedPath) === ".mp3") {
    const oggFilePath = path.join(
      uploadConfig.directory,
      sanitizedPath.replace(".mp3", ".ogg")
    );
    const mp3FilePath = path.join(uploadConfig.directory, sanitizedPath);

    try {
      // Check if .mp3 file already exists (is cached)
      fs.statSync(mp3FilePath);
      return res.sendFile(mp3FilePath);
    } catch (mp3Error) {
      try {
        // Check if .ogg file exists
        fs.statSync(oggFilePath);

        // Convert .ogg to .mp3
        ffmpeg(oggFilePath)
          .toFormat("mp3")
          .on("error", err => {
            console.error("Failed to convert file:", err);
            return next();
          })
          .on("end", () => {
            console.log("File successfully converted");
            return res.sendFile(mp3FilePath);
          })
          .save(mp3FilePath); // Save the converted file
      } catch (oggError) {
        // If .ogg file does not exist, proceed with the next middleware
        return next();
      }
    }
  } else {
    // If the request is not for an .mp3 file, proceed with the next middleware
    next();
  }
});
app.use("/public", express.static(uploadConfig.directory));
app.use(routes);

app.use(Sentry.Handlers.errorHandler());

app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error({ err });
  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
