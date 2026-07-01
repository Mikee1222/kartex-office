import { format, getDay, parse, startOfWeek } from "date-fns";
import { el } from "date-fns/locale";
import { dateFnsLocalizer } from "react-big-calendar";

export const scheduleLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { el },
});

export const scheduleMessages = {
  today: "Σήμερα",
  previous: "Πίσω",
  next: "Επόμενο",
  month: "Μήνας",
  week: "Εβδομάδα",
  day: "Ημέρα",
  agenda: "Ατζέντα",
  date: "Ημερομηνία",
  time: "Ώρα",
  event: "Γεγονός",
  noEventsInRange: "Δεν υπάρχουν γεγονότα σε αυτό το διάστημα.",
  showMore: (total: number) => `+${total} ακόμα`,
};
