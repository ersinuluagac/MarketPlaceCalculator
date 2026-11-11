import test from "node:test";
import assert from "node:assert/strict";
import { calculateNetProfit } from "../calculator.js";
import { consts } from "../data.js";

function calculate(sale, cost = 30, rate = 10, desi = 1, vat = 1.2) {
  return calculateNetProfit(sale, rate, cost, vat, consts.companies.tex, desi, consts.taxAndTransaction);
}

test("customer invoice, payout and profit reconcile separately", () => {
  const data = calculate(120);
  assert.equal(data.invoiceNet, "100.00");
  assert.equal(data.vatSale, "20.00");
  assert.equal(data.fullCommissionCost, 12);
  assert.equal(data.fullFastShippingCost, "46.49");
  assert.equal(data.fullNormalTransactionCost, "13.19");
  assert.equal(data.amountToDepositedFast, "48.32");
  assert.equal(data.netProfitFast, "10.27");
});

test("all scenarios reconcile in kuruş, including negative VAT balances", () => {
  for (const vat of [1, 1.01, 1.1, 1.2]) {
    for (const [sale, desi, tariff] of [
      [199.99, 10, "Alt Barem"], [200, 10, "Üst Barem"],
      [349.99, 10, "Üst Barem"], [350, 10, "Normal"], [120, 11, "Normal"]
    ]) {
      const data = calculate(sale, 300, 7.45, desi, vat);
      const cents = value => Math.round(Number(value) * 100);
      assert.equal(data.shippingType, tariff);
      assert.equal(cents(data.invoiceNet) + cents(data.vatSale), cents(sale));
      for (const mode of ["Normal", "Fast", "Today"]) {
        const payout = cents(data["amountToDeposited" + mode]);
        assert.equal(payout - cents(data.fullProductCost) - cents(data["totalVat" + mode]), cents(data["netProfit" + mode]));
      }
    }
  }
});

test("rounds half-kuruş commission once and handles zero cost", () => {
  const data = calculate(120.10, 0, 5);
  assert.equal(data.fullCommissionCost, 6.01);
  assert.equal(data.roiFast, null);
});
