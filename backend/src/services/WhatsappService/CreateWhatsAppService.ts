// src/services/WhatsappService/CreateWhatsAppService.ts
import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";

interface Request {
  name: string;
  queueIds?: number[];
  greetingMessage?: string;
  farewellMessage?: string;
  status?: string;
  isDefault?: boolean;
  color?: string;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const CreateWhatsAppService = async ({
  name,
  status = "OPENING",
  queueIds = [],
  greetingMessage,
  farewellMessage,
  isDefault = false,
  color = "#FFFFFF" // Valor por defecto para el color
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string()
      .required()
      .min(2)
      .test(
        "Check-name",
        "This whatsapp name is already used.",
        async value => {
          if (!value) return false;
          const nameExists = await Whatsapp.findOne({
            where: { name: value }
          });
          return !nameExists;
        }
      ),
    isDefault: Yup.boolean().required(),
    color: Yup.string()
      .matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Invalid color format")
      .nullable() // Valida formato de color hexadecimal
  });

  try {
    await schema.validate({ name, status, isDefault, color });
  } catch (err) {
    throw new AppError((err as Error).message);
  }

  const whatsappFound = await Whatsapp.findOne();

  isDefault = !whatsappFound;

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { isDefault: true }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false });
    }
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  const whatsapp = await Whatsapp.create(
    {
      name,
      status,
      greetingMessage,
      farewellMessage,
      isDefault,
      color
    },
    { include: ["queues"] }
  );

  await AssociateWhatsappQueue(whatsapp, queueIds);

  return { whatsapp, oldDefaultWhatsapp };
};

export default CreateWhatsAppService;
