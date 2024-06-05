import { subHours } from "date-fns";
import { Op } from "sequelize";
import { Mutex } from "async-mutex";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import Whatsapp from "../../models/Whatsapp";

// Mapa para almacenar mutexes dinámicamente
const mutexes = new Map();

const getMutex = (whatsappId: number, contactId: number) => {
  const key = `${whatsappId}-${contactId}`;
  if (!mutexes.has(key)) {
    mutexes.set(key, new Mutex());
  }
  return mutexes.get(key);
};

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsappId: number,
  unreadMessages: number,
  groupContact?: Contact
): Promise<Ticket> => {
  const contactId = groupContact ? groupContact.id : contact.id;
  const mutex = getMutex(whatsappId, contactId);

  let ticket;

  await mutex.runExclusive(async () => {
    // Verifica si ya existe un ticket abierto para este contacto y conexión
    ticket = await Ticket.findOne({
      where: {
        status: {
          [Op.or]: ["open", "pending"]
        },
        contactId,
        whatsappId
      },
      include: [
        {
          model: Whatsapp,
          attributes: ["color"] // Only fetch the color attribute from the Whatsapp model
        }
      ]
    });

    if (ticket) {
      //@ts-ignore
      await ticket.update({ unreadMessages });
      return;
    }

    if (!ticket && groupContact) {
      ticket = await Ticket.findOne({
        where: {
          contactId: groupContact.id,
          whatsappId
        },
        include: [
          {
            model: Whatsapp,
            attributes: ["color"] // Only fetch the color attribute from the Whatsapp model
          }
        ],
        order: [["updatedAt", "DESC"]]
      });

      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: null,
          unreadMessages
        });
        return;
      }
    }

    if (!ticket && !groupContact) {
      ticket = await Ticket.findOne({
        where: {
          updatedAt: {
            [Op.between]: [+subHours(new Date(), 2), +new Date()]
          },
          contactId: contact.id,
          whatsappId
        },
        include: [
          {
            model: Whatsapp,
            attributes: ["color"] // Only fetch the color attribute from the Whatsapp model
          }
        ],
        order: [["updatedAt", "DESC"]]
      });

      if (ticket) {
        await ticket.update({
          status: "pending",
          userId: null,
          unreadMessages
        });
        return;
      }
    }

    if (!ticket) {
      ticket = await Ticket.create(
        {
          contactId: groupContact ? groupContact.id : contact.id,
          status: "pending",
          isGroup: !!groupContact,
          unreadMessages,
          whatsappId
        },
        {
          include: [
            {
              model: Whatsapp,
              attributes: ["color"] // Only fetch the color attribute from the Whatsapp model
            }
          ]
        }
      );
    }
  });

  //@ts-ignore
  ticket = await ShowTicketService(ticket.id);

  return ticket;
};

export default FindOrCreateTicketService;
