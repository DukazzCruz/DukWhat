// src/routes/whatsappRoutes.ts
import express from "express";
import isAuth from "../middleware/isAuth";
import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();

// Aplicar 'isAuth' a todas las rutas de este router
whatsappRoutes.use(isAuth);

whatsappRoutes
  .route("/whatsapp/")
  .get(WhatsAppController.index)
  .post(WhatsAppController.store);

whatsappRoutes
  .route("/whatsapp/:whatsappId")
  .get(WhatsAppController.show)
  .put(WhatsAppController.update)
  .delete(WhatsAppController.remove);

whatsappRoutes.post(
  "/whatsapp/:whatsappId/restart",
  WhatsAppController.restart
);
whatsappRoutes.post(
  "/whatsapp/:whatsappId/shutdown",
  WhatsAppController.shutdown
);

export default whatsappRoutes;
