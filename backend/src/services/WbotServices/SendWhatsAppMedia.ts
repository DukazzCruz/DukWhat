import fs from "fs";
import {
  MessageMedia,
  Message as WbotMessage,
  MessageSendOptions
} from "whatsapp-web.js";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";


import formatBody from "../../helpers/Mustache";
import { logger } from "../../utils/logger";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
}

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body
}: Request): Promise<WbotMessage> => {
  try {
    logger.info(
      `Attempting to send media. File: ${media.originalname}, Ticket ID: ${ticket.id}`
    );

    const wbot = await GetTicketWbot(ticket);
    logger.debug("WhatsApp client retrieved successfully.");

    const hasBody = body
      ? formatBody(body as string, ticket.contact)
      : undefined;
    logger.debug(`Media caption set to: ${hasBody}`);

    const newMedia = MessageMedia.fromFilePath(media.path);
    logger.debug(`Media created from path: ${media.path}`);

    const mediaOptions: MessageSendOptions = {
      caption: hasBody,
      sendAudioAsVoice: true //TODO:CORREGIR LAS NOTAS DE VOZ // media.mimetype.startsWith("audio/")
    };

    // Determine if media should be sent as a document
    if (
      newMedia.mimetype.startsWith("image/") &&
      !/^.*\.(jpe?g|png|gif)?$/i.test(media.filename)
    ) {
      mediaOptions.sendMediaAsDocument = true;
    }

    logger.debug(`Sending media with options: ${JSON.stringify(mediaOptions)}`);
    const sentMessage = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`,
      newMedia,
      mediaOptions
    );

    logger.info(`Media sent successfully: ${media.filename}`);
    await ticket.update({ lastMessage: body || media.filename });

    // Safely remove the file
    try {
      fs.unlinkSync(media.path);
      logger.debug(`File deleted successfully: ${media.path}`);
    } catch (fileErr) {
      logger.error(`Error deleting file: ${fileErr}`);
    }

    return sentMessage;
  } catch (err) {
    logger.error(`Error sending media file ${media.originalname}: ${err}`);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
