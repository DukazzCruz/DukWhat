import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

import "./database";
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
app.use('/public', async (req, res, next) => {
  if (path.extname(req.path) === '.mp3') {
    const oggFilePath = path.join(uploadConfig.directory, req.path.replace('.mp3', '.ogg'));
    const mp3FilePath = path.join(uploadConfig.directory, req.path);

    // Verifica si el archivo .mp3 ya existe (está en cache)
    if (fs.existsSync(mp3FilePath)) {
      return res.sendFile(mp3FilePath);
    }

    // Verifica si el archivo .ogg existe
    if (fs.existsSync(oggFilePath)) {
      try {
        // Convierte .ogg a .mp3
        ffmpeg(oggFilePath)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error('No se pudo convertir el archivo:', err);
            return next();
          })
          .on('end', () => {
            console.log('Archivo convertido con éxito');
            return res.sendFile(mp3FilePath);
          })
          .save(mp3FilePath); // Guarda el archivo convertido
      } catch (err) {
        console.error('Error al convertir el archivo:', err);
        return res.status(500).send('Error al procesar el archivo');
      }
    } else {
      // Si no existe el archivo .ogg, procede con la siguiente middleware
      return next();
    }
  } else {
    // Si la solicitud no es para un archivo .mp3, procede con la siguiente middleware
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

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
