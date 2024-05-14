// src/services/WhatsappService/RestartWhatsAppService.ts
import { getWbot, restartWbot } from "../../libs/wbot";
import { logger } from "../../utils/logger";

const RestartWhatsAppService = async (whatsappId: string): Promise<void> => {
  const whatsappIDNumber: number = parseInt(whatsappId, 10);

  try {
    const wbot = getWbot(whatsappIDNumber);
    if (!wbot) {
      throw new Error("No active session found for this ID.");
    }

    await restartWbot(whatsappIDNumber);
    logger.info(`WhatsApp session for ID ${whatsappId} has been restarted.`);
  } catch (error) {
    // Aquí solo logueamos el error, no lo lanzamos de nuevo
    logger.error(
      `Failed to restart WhatsApp session: ${(error as Error).message}`
    );
    // Opcional: podrías realizar alguna otra acción, como notificar a un sistema de monitoreo
  }
};

export default RestartWhatsAppService;
