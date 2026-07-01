import type Anthropic from "@anthropic-ai/sdk";

export const TOOL_NAMES = [
  "get_orders",
  "update_order_status",
  "assign_driver_to_order",
  "create_delivery_trip",
  "create_customer",
  "update_stock",
  "get_report",
  "generate_invoice_pdf",
  "search_customer",
  "get_weather",
  "send_email",
  "create_order",
  "generate_z_report",
  "submit_to_mydata",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const WRITE_TOOLS = new Set<ToolName>([
  "update_order_status",
  "assign_driver_to_order",
  "create_delivery_trip",
  "create_customer",
  "update_stock",
  "send_email",
  "create_order",
  "generate_z_report",
  "submit_to_mydata",
]);

export const DESTRUCTIVE_TOOLS = new Set<ToolName>(["update_order_status"]);

export function isWriteTool(name: string): name is ToolName {
  return WRITE_TOOLS.has(name as ToolName);
}

export function isDestructiveTool(name: ToolName, input: Record<string, unknown>): boolean {
  if (name === "update_order_status") {
    const status = String(input.status ?? "");
    return status === "Ακυρώθηκε" || status.toLowerCase() === "cancelled";
  }
  return DESTRUCTIVE_TOOLS.has(name);
}

export function describePendingAction(
  toolName: ToolName,
  input: Record<string, unknown>,
): string {
  switch (toolName) {
    case "update_order_status":
      return `Αλλαγή κατάστασης παραγγελίας σε «${String(input.status ?? "")}»`;
    case "assign_driver_to_order":
      return `Ανάθεση οδηγού στην παραγγελία`;
    case "create_delivery_trip":
      return `Δημιουργία δρομολογίου (${String(input.trip_date ?? "")})`;
    case "create_customer":
      return `Δημιουργία πελάτη «${String(input.name ?? "")}»`;
    case "update_stock":
      return `Ενημέρωση αποθέματος (${input.quantity ?? 0} τεμ.)`;
    case "send_email":
      return `Αποστολή email προς ${String(input.to ?? "")}`;
    case "create_order":
      return `Δημιουργία νέας παραγγελίας`;
    case "generate_z_report":
      return `Έκδοση ημερήσιου Ζ (${String(input.report_date ?? "σήμερα")})`;
    case "submit_to_mydata":
      return `Υποβολή Ζ στο myDATA (${String(input.report_date ?? "σήμερα")})`;
    default:
      return toolName;
  }
}

export const DOLPHIN_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_orders",
    description: "Αναζήτηση και λήψη παραγγελιών με φίλτρα",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Κατάσταση παραγγελίας" },
        customer_name: { type: "string", description: "Όνομα πελάτη" },
        order_number: { type: "string", description: "Αριθμός παραγγελίας" },
        limit: { type: "number", description: "Μέγιστος αριθμός αποτελεσμάτων" },
      },
    },
  },
  {
    name: "update_order_status",
    description: "Αλλαγή κατάστασης παραγγελίας",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "UUID παραγγελίας" },
        status: { type: "string", description: "Νέα κατάσταση" },
        notes: { type: "string", description: "Σημειώσεις" },
      },
      required: ["order_id", "status"],
    },
  },
  {
    name: "assign_driver_to_order",
    description: "Ανάθεση οδηγού σε παραγγελία",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        driver_id: { type: "string" },
        vehicle_id: { type: "string" },
        delivery_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["order_id", "driver_id"],
    },
  },
  {
    name: "create_delivery_trip",
    description: "Δημιουργία νέου δρομολογίου",
    input_schema: {
      type: "object",
      properties: {
        driver_id: { type: "string" },
        vehicle_id: { type: "string" },
        trip_date: { type: "string", description: "YYYY-MM-DD" },
        order_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs παραγγελιών για το δρομολόγιο",
        },
      },
      required: ["driver_id", "vehicle_id", "trip_date"],
    },
  },
  {
    name: "create_customer",
    description: "Δημιουργία νέου πελάτη",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: { type: "string", description: "hospital/hotel/walk-in" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        city: { type: "string" },
        payment_terms: { type: "string" },
      },
      required: ["name"],
    },
  },
  {
    name: "update_stock",
    description: "Ενημέρωση αποθέματος προϊόντος (προσθήκη/αφαίρεση)",
    input_schema: {
      type: "object",
      properties: {
        product_id: { type: "string" },
        quantity: { type: "number", description: "Θετικό=προσθήκη, αρνητικό=αφαίρεση" },
        reason: { type: "string" },
      },
      required: ["product_id", "quantity"],
    },
  },
  {
    name: "get_report",
    description: "Λήψη αναφοράς/στατιστικών",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "revenue | orders | customers | inventory | margins",
        },
        period: {
          type: "string",
          description: "today | week | month | year",
        },
      },
      required: ["type"],
    },
  },
  {
    name: "generate_invoice_pdf",
    description: "Σύνδεσμος τιμολογίου PDF για παραγγελία",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        send_email: { type: "boolean" },
        email: { type: "string" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "search_customer",
    description: "Αναζήτηση πελάτη",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_weather",
    description: "Τρέχων καιρός για πόλη",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" },
      },
      required: ["city"],
    },
  },
  {
    name: "send_email",
    description: "Αποστολή email σε πελάτη",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "create_order",
    description: "Δημιουργία νέας παραγγελίας",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_id: { type: "string" },
              quantity: { type: "number" },
              unit_price: { type: "number" },
            },
          },
        },
        delivery_date: { type: "string" },
        notes: { type: "string" },
        payment_terms: { type: "string" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "generate_z_report",
    description: "Έκδοση και αποθήκευση ημερήσιου Ζ (ταμειακή κλείσιμο)",
    input_schema: {
      type: "object",
      properties: {
        report_date: {
          type: "string",
          description: "YYYY-MM-DD (προεπιλογή: σήμερα Athens)",
        },
      },
    },
  },
  {
    name: "submit_to_mydata",
    description: "Υποβολή ημερήσιου Ζ στην πλατφόρμα myDATA ΑΑΔΕ",
    input_schema: {
      type: "object",
      properties: {
        report_date: {
          type: "string",
          description: "YYYY-MM-DD (προεπιλογή: σήμερα Athens)",
        },
      },
    },
  },
];
