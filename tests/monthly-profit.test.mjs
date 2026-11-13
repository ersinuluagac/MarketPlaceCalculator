import test from "node:test";
import assert from "node:assert/strict";
import { productEarnings } from "../monthly.js";

test("cash and profit use identical coverage and total precedes unit rounding", () => {
  const product = {qty: 5, profitQty: 3, profitInvoice: 12000, profitFees: -1199};
  const actual = productEarnings(product, 1000, 20);
  assert.equal(actual.cashPerUnit, 7201 / 3);
  assert.equal(actual.profit, 6001);
  assert.equal(actual.profitPerUnit, 6001 / 3);
  assert.notEqual(actual.profit, Math.round(actual.profitPerUnit) * 3);
});

test("product and service VAT are separated even at zero cost or negative profit", () => {
  const product = {profitQty: 1, profitInvoice: 11000, profitFees: -2400};
  assert.equal(productEarnings(product, 0, 10).profit, 8000);
  assert.deepEqual(productEarnings(product, 9000, 10), {cashPerUnit: -1300, profitPerUnit: -1000, profit: -1000});
  assert.equal(productEarnings({...product, profitQty: 0}, 1000, 20), null);
});
