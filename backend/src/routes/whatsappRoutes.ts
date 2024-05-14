// src/routes/whatsappRoutes.ts
import express from "express";
import isAuth from "../middleware/isAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();

// Aplicar 'isAuth' a todas las rutas de este router
whatsappRoutes.use(isAuth);

whatsappRoutes.get("/whatsapp/", WhatsAppController.index);
whatsappRoutes.post("/whatsapp/", WhatsAppController.store);
whatsappRoutes.get("/whatsapp/:whatsappId", WhatsAppController.show);
whatsappRoutes.put("/whatsapp/:whatsappId", WhatsAppController.update);
whatsappRoutes.delete("/whatsapp/:whatsappId", WhatsAppController.remove);
whatsappRoutes.post(
  "/whatsapp/:whatsappId/restart",
  WhatsAppController.restart
);

export default whatsappRoutes;
