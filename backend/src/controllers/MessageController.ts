import { Request, Response } from "express";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import EditWhatsAppMessage from "../services/WbotServices/EditWhatsAppMessage";
import { logger } from "../utils/logger";

type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  try {
    logger.info(`Received request to store message for ticket ${ticketId}`);
    // logger.info({ body, quotedMsg, medias });

    const ticket = await ShowTicketService(ticketId);
    SetTicketMessagesAsRead(ticket);

    if (medias && medias.length > 0) {
      logger.info(`Processing ${medias.length} media files`);

      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          try {
            logger.info(`Sending media file ${media.originalname}`);
            await SendWhatsAppMedia({ media, ticket });
            logger.info(`Sent media file ${media.originalname}`);
          } catch (mediaError) {
            logger.error(
              `Error sending media file ${media.originalname}`,
              mediaError
            );
            throw mediaError; // Re-lanzar el error para ser capturado por el bloque externo
          }
        })
      );
    } else {
      logger.info("No media files to process, sending text message");
      await SendWhatsAppMessage({ body, ticket, quotedMsg });
    }

    return res.status(204).send();
  } catch (error) {
    logger.error("Error storing message", error);
    return res.status(500).send("Failed to store message");
  }
};

export const edit = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { body }: MessageData = req.body;

  const message = await EditWhatsAppMessage(messageId, body);

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit("appMessage", {
    action: "update",
    message
  });

  return res.send();
};
