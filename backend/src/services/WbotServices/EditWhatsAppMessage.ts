import AppError from "../../errors/AppError";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import formatBody from "../../helpers/Mustache";

const EditWhatsAppMessage = async (
  messageId: string,
  newBody: string
): Promise<Message> => {
  const message = await Message.findByPk(messageId, {
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      },
      {
        model: Contact,
        as: "contact"
      }
    ]
  });

  if (!message) {
    throw new AppError("No message found with this ID.");
  }
  const hasBody = newBody
    ? formatBody(newBody as string, message.contact)
    : undefined;

  if (!hasBody) {
    throw new AppError("No message found with this newBody.");
  }
  const { ticket } = message;

  const messageToEdit = await GetWbotMessage(ticket, messageId);

  try {
    const res = await messageToEdit.edit(hasBody);
    if (res === null) throw new Error("Can't edit");
  } catch (err) {
    throw new AppError("ERR_EDITING_WAPP_MSG");
  }
  await message.update({ body: hasBody });
  if (ticket.lastMessage === message.body) {
    await ticket.update({ lastMessage: hasBody });
  }

  // Buscar el mensaje más reciente en el ticket
  const mostRecentMessage = await Message.findOne({
    where: { ticketId: ticket.id },
    order: [["updatedAt", "DESC"]]
  });

  // Si el mensaje más reciente es el que estamos editando
  if (mostRecentMessage && mostRecentMessage.id === messageId) {
    await ticket.update({ lastMessage: newBody });
  }

  return message;
};

export default EditWhatsAppMessage;
