// src/controllers/WhatsAppController.ts
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { initWbot, removeWbot, shutdownWbot } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import RestartWhatsAppService from "../services/WhatsappService/RestartWhatsAppService";
import Whatsapp from "../models/Whatsapp";

interface WhatsappData {
  name: string;
  queueIds: number[];
  greetingMessage?: string;
  farewellMessage?: string;
  status?: string;
  isDefault?: boolean;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const whatsapps = await ListWhatsAppsService();

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds,
    color // Añadir color aquí
  }: WhatsappData & { color?: string } = req.body;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds,
    color
  });

  StartWhatsAppSession(whatsapp);

  const io = getIO();
  io.emit("whatsapp", {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit("whatsapp", {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp = await ShowWhatsAppService(whatsappId);

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds,
    color // Añadir color aquí
  }: WhatsappData & { color?: string } = req.body; // Asegurarse de incluirlo en la interfaz

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappId,
    whatsappData: {
      name,
      status,
      isDefault,
      greetingMessage,
      farewellMessage,
      queueIds,
      color // Pasar color al servicio
    }
  });

  const io = getIO();
  io.emit("whatsapp", {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.emit("whatsapp", {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  await DeleteWhatsAppService(whatsappId);
  removeWbot(+whatsappId);

  const io = getIO();
  io.emit("whatsapp", {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Whatsapp deleted." });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  try {
    await RestartWhatsAppService(whatsappId);
    const io = getIO();
    io.emit("whatsapp", {
      action: "update",
      whatsappId
    });
    return res
      .status(200)
      .json({ message: "WhatsApp session restarted successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to restart WhatsApp session.",
      error: (error as Error).message
    });
  }
};

// Nueva función para apagar el cliente
export const shutdown = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;

  try {
    await shutdownWbot(whatsappId);
    const io = getIO();
    io.emit("whatsapp", {
      action: "update",
      whatsappId
    });
    return res
      .status(200)
      .json({ message: "WhatsApp session shutdown successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to shutdown WhatsApp session.",
      error: (error as Error).message
    });
  }
};

export const start = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) throw Error("no se encontro el whatsapp");

  try {
    await initWbot(whatsapp); // Inicializa una nueva sesión
    const io = getIO();
    io.emit("whatsapp", {
      action: "update",
      whatsappId
    });
    return res
      .status(200)
      .json({ message: "WhatsApp session started successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to start WhatsApp session.",
      error: (error as Error).message
    });
  }
};
