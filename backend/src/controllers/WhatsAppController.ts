import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { removeWbot } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";

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
  }: WhatsappData & { color?: string }= req.body;

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
<<<<<<< HEAD
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    farewellMessage,
    queueIds,
    color  // Añadir color aquí
  }: WhatsappData & { color?: string } = req.body;  // Asegurarse de incluirlo en la interfaz

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappId,
    whatsappData: {
=======
  export const update = async (
    req: Request, 
    res: Response
  ): Promise<Response> => {
    const { whatsappId } = req.params;
    const {
>>>>>>> 166f3842b1289c71e47e20fc354da26013961d13
      name,
      status,
      isDefault,
      greetingMessage,
      farewellMessage,
      queueIds,
<<<<<<< HEAD
      color  // Pasar color al servicio
    }
  });
=======
      color  // Añadir color aquí
    }: WhatsappData & { color?: string } = req.body;  // Asegurarse de incluirlo en la interfaz
  
    const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
      whatsappId,
      whatsappData: {
        name,
        status,
        isDefault,
        greetingMessage,
        farewellMessage,
        queueIds,
        color  // Pasar color al servicio
      }
    });
>>>>>>> 166f3842b1289c71e47e20fc354da26013961d13

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
