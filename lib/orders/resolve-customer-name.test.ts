import assert from "node:assert/strict";

import { resolveCustomerName } from "@/lib/orders/resolve-customer-name";

function testPrefersLinkedCustomerName() {
  assert.equal(
    resolveCustomerName({
      customer_name: "Quote Name",
      customers: { name: "Acme Corp" },
      quote_request: { contact_name: "Jane Doe" },
    }),
    "Acme Corp",
  );
}

function testFallsBackToOrderCustomerName() {
  assert.equal(
    resolveCustomerName({
      customer_name: "Quote Converted Customer",
      customers: null,
      quote_request: { contact_name: "Jane Doe" },
    }),
    "Quote Converted Customer",
  );
}

function testFallsBackToQuoteContactName() {
  assert.equal(
    resolveCustomerName({
      customers: null,
      quote_request: { contact_name: "Jane Doe" },
    }),
    "Jane Doe",
  );
}

function testReturnsEmDashWhenNothingAvailable() {
  assert.equal(resolveCustomerName({}), "—");
}

testPrefersLinkedCustomerName();
testFallsBackToOrderCustomerName();
testFallsBackToQuoteContactName();
testReturnsEmDashWhenNothingAvailable();

console.log("resolve-customer-name.test.ts: all tests passed");
