import { Client as Session } from "whatsapp-web.js";
import { getWbot } from "../libs/wbot";
import GetDefaultWhatsApp from "./GetDefaultWhatsApp";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";

const GetTicketWbot = async (ticket: Ticket): Promise<Session> => {
  try {
    if (!ticket.whatsappId) {
      logger.info(
        `Ticket ${ticket.id} does not have a WhatsApp ID, fetching default WhatsApp`
      );
      const defaultWhatsapp = await GetDefaultWhatsApp(ticket.user.id);
      logger.info(`Default WhatsApp fetched: ${defaultWhatsapp.id}`);

      await ticket.$set("whatsapp", defaultWhatsapp);
      logger.info(`WhatsApp set for ticket ${ticket.id}`);
    }

    const wbot = getWbot(ticket.whatsappId);
    logger.info(
      `WhatsApp client obtained for WhatsApp ID: ${ticket.whatsappId}`
    );

    // logger.info({ wbot });

    return wbot;
  } catch (error) {
    logger.error(
      `Error getting WhatsApp client for ticket ${ticket.id}:`,
      error
    );
    throw new Error("Failed to get WhatsApp client");
  }
};

export default GetTicketWbot;
