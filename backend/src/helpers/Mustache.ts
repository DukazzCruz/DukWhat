import Mustache from "mustache";
import Contact from "../models/Contact";

// Función para determinar el saludo según la hora del día
function getGreeting(): string {
  const timeZone = process.env.TZ || "America/Fortaleza";
  const hour: number = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone
    }).format(new Date()),
    10
  );

  if (hour < 12) {
    return "Buenos días";
  }
  if (hour < 18) {
    return "Buenas tardes";
  }
  return "Buenas noches";
}

export default (body: string, contact: Contact): string => {
  const view = {
    name: contact ? contact.name || contact.number : "",
    greeting: getGreeting() // Incluye el saludo dinámico
  };
  return Mustache.render(body, view);
};
