// src/services/WhatsappService/RestartWhatsAppService.ts
import { whatsappProvider } from "../../providers/WhatsApp";
import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

const RestartWhatsAppService = async (whatsappId: string): Promise<void> => {
  const whatsappIDNumber: number = parseInt(whatsappId, 10);

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappIDNumber);
    if (!whatsapp) {
      throw new AppError("WhatsApp not found.");
    }

    whatsappProvider.removeSession(whatsappIDNumber);
    await whatsappProvider.init(whatsapp);
    logger.info(`WhatsApp session for ID ${whatsappId} has been restarted.`);
  } catch (error) {
    logger.error(
      `Failed to restart WhatsApp session: ${(error as Error).message}`
    );
  }
};

export default RestartWhatsAppService;
