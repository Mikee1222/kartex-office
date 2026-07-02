import assert from "node:assert/strict";

import {
  buildOrderDeliveryPayload,
  getDeliveryFieldErrors,
} from "./delivery-fields";

function testAddressPathPayload() {
  const payload = buildOrderDeliveryPayload({
    deliveryMethod: "address",
    deliveryRecipientName: "Maria Papadopoulou",
    deliveryAddress: "Leoforos 12",
    deliveryCity: "Athens",
    deliveryPostalCode: "10431",
    pickupAgency: "",
  });

  assert.equal(payload.delivery_method, "address");
  assert.equal(payload.delivery_recipient_name, "Maria Papadopoulou");
  assert.equal(payload.delivery_address, "Leoforos 12");
  assert.equal(payload.delivery_city, "Athens");
  assert.equal(payload.delivery_postal_code, "10431");
  assert.equal(payload.pickup_agency, null);
}

function testPickupPathPayload() {
  const payload = buildOrderDeliveryPayload({
    deliveryMethod: "pickup",
    deliveryRecipientName: "Nikos Georgiou",
    deliveryAddress: "should not be sent",
    deliveryCity: "should not be sent",
    deliveryPostalCode: "should not be sent",
    pickupAgency: "ACS Metamorfosis",
  });

  assert.equal(payload.delivery_method, "pickup");
  assert.equal(payload.delivery_recipient_name, "Nikos Georgiou");
  assert.equal(payload.delivery_address, null);
  assert.equal(payload.delivery_city, null);
  assert.equal(payload.delivery_postal_code, null);
  assert.equal(payload.pickup_agency, "ACS Metamorfosis");
}

function testMissingRecipientNameValidation() {
  const errors = getDeliveryFieldErrors({
    deliveryMethod: "address",
    deliveryRecipientName: "",
    deliveryAddress: "Leoforos 12",
    deliveryCity: "Athens",
    deliveryPostalCode: "10431",
    pickupAgency: "",
  });

  assert.ok(errors.delivery_recipient_name);
  assert.equal(errors.delivery_address, undefined);
}

function testMissingAddressFieldsValidation() {
  const errors = getDeliveryFieldErrors({
    deliveryMethod: "address",
    deliveryRecipientName: "Maria Papadopoulou",
    deliveryAddress: "Leoforos 12",
    deliveryCity: "",
    deliveryPostalCode: "",
    pickupAgency: "",
  });

  assert.equal(errors.delivery_recipient_name, undefined);
  assert.ok(errors.delivery_city);
  assert.ok(errors.delivery_postal_code);
}

function testValidAddressHasNoErrors() {
  const errors = getDeliveryFieldErrors({
    deliveryMethod: "address",
    deliveryRecipientName: "Maria Papadopoulou",
    deliveryAddress: "Leoforos 12",
    deliveryCity: "Athens",
    deliveryPostalCode: "10431",
    pickupAgency: "",
  });

  assert.deepEqual(errors, {});
}

function testValidPickupHasNoErrors() {
  const errors = getDeliveryFieldErrors({
    deliveryMethod: "pickup",
    deliveryRecipientName: "Nikos Georgiou",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryPostalCode: "",
    pickupAgency: "ACS Metamorfosis",
  });

  assert.deepEqual(errors, {});
}

testAddressPathPayload();
testPickupPathPayload();
testMissingRecipientNameValidation();
testMissingAddressFieldsValidation();
testValidAddressHasNoErrors();
testValidPickupHasNoErrors();

console.log("delivery-fields.test.ts: all tests passed");
