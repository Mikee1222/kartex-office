import type { DeliveryMethod } from "@/types/database";

export const DELIVERY_REQUIRED_MSG = "Αυτό το πεδίο είναι υποχρεωτικό.";

export type DeliveryFieldKey =
  | "delivery_method"
  | "delivery_recipient_name"
  | "delivery_address"
  | "delivery_city"
  | "delivery_postal_code"
  | "pickup_agency";

export type DeliveryFieldErrors = Partial<Record<DeliveryFieldKey, string>>;

export type DeliveryFormValues = {
  deliveryMethod: DeliveryMethod | "";
  deliveryRecipientName: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  pickupAgency: string;
};

export function getDeliveryFieldErrors(
  values: DeliveryFormValues,
): DeliveryFieldErrors {
  const errors: DeliveryFieldErrors = {};

  if (!values.deliveryMethod) {
    errors.delivery_method = DELIVERY_REQUIRED_MSG;
    return errors;
  }

  if (!values.deliveryRecipientName.trim()) {
    errors.delivery_recipient_name = DELIVERY_REQUIRED_MSG;
  }

  if (values.deliveryMethod === "address") {
    if (!values.deliveryAddress.trim()) {
      errors.delivery_address = DELIVERY_REQUIRED_MSG;
    }
    if (!values.deliveryCity.trim()) {
      errors.delivery_city = DELIVERY_REQUIRED_MSG;
    }
    if (!values.deliveryPostalCode.trim()) {
      errors.delivery_postal_code = DELIVERY_REQUIRED_MSG;
    }
  } else if (values.deliveryMethod === "pickup" && !values.pickupAgency.trim()) {
    errors.pickup_agency = DELIVERY_REQUIRED_MSG;
  }

  return errors;
}

export type OrderDeliveryPayload = {
  delivery_method: DeliveryMethod | null;
  delivery_recipient_name: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_postal_code: string | null;
  pickup_agency: string | null;
};

export function buildOrderDeliveryPayload(
  values: DeliveryFormValues,
): OrderDeliveryPayload {
  const method = values.deliveryMethod;

  if (!method) {
    return {
      delivery_method: null,
      delivery_recipient_name: null,
      delivery_address: null,
      delivery_city: null,
      delivery_postal_code: null,
      pickup_agency: null,
    };
  }

  if (method === "address") {
    return {
      delivery_method: method,
      delivery_recipient_name: values.deliveryRecipientName.trim(),
      delivery_address: values.deliveryAddress.trim(),
      delivery_city: values.deliveryCity.trim(),
      delivery_postal_code: values.deliveryPostalCode.trim(),
      pickup_agency: null,
    };
  }

  return {
    delivery_method: method,
    delivery_recipient_name: values.deliveryRecipientName.trim(),
    delivery_address: null,
    delivery_city: null,
    delivery_postal_code: null,
    pickup_agency: values.pickupAgency.trim(),
  };
}
