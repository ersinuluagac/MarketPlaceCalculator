import test from "node:test";
import assert from "node:assert/strict";
import {monthlyReport, productEarnings, historicalEarnings} from "../monthly.js";

const orderHeaders = ["Sipariş Numarası", "Stok Kodu", "Ürün Adı", "Adet", "Satış Tutarı", "Faturalanacak Tutar", "Sipariş Statüsü"];
const financeHeaders = ["Sipariş No", "Net Tutar", "Gönderi Kargo Bedeli", "Platform Hizmet Bedeli", "Komisyon/Yurt Dışı Stok Destek Bedeli",
  "İade Kargo Bedeli", "Ülke", "Sipariş Statüsü", "İade", "İptal", "Ürün Adedi", "Sipariş Tutarı", "İndirim", "Ceza Bedeli"];
const line = (key, sku, qty, gross, invoice = gross, status = "Teslim Edildi") => [key, sku, sku, qty, gross, invoice, status];
function finance(key, gross, qty, {refund = 0, cancel = 0, cargo = 0, fee = 0, commission = 0, returnCargo = 0,
  discount = 0, penalty = 0, other = 0, country = "Türkiye", status = "Teslim Edildi"} = {}) {
  const net = gross + refund + cancel + cargo + fee + commission + returnCargo + discount + penalty + other;
  return [key, net, cargo, fee, commission, returnCargo, country, status, refund, cancel, qty, gross, discount, penalty];
}
const report = (lines, finances) => monthlyReport([orderHeaders, ...lines], [financeHeaders, ...finances]);

test("dated costs follow each barcode and each order day across a price and VAT change", () => {
  const productRows = [[...orderHeaders, "Barkod", "Sipariş Tarihi"]];
  const financeRows = [[...financeHeaders, "Sipariş Tarihi", "Ödeme Yöntemi"]];
  for (const [key, barcode, day, amount] of [["A","001","2026-09-01",120], ["B","001","15.09.2026 14:00",110], ["C","002","",120]]) {
    productRows.push([...line(key, "Aynı ürün", 1, amount), barcode, day]);
    financeRows.push([...finance(key, amount, 1), key === "C" ? "2026-09-30" : "", "Kredi Kartı"]);
  }
  const {products: [p]} = monthlyReport(productRows, financeRows);
  const rate = (valid_from, cost_cents, vat_rate) => ({valid_from, cost_cents, vat_rate});
  const history = new Map([["barcode:001", [rate("2026-09-15", 4000, 10), rate("2026-09-01", 2000, 20)]],
    ["barcode:002", [rate("2026-01-01", 5000, 20)]]]);
  const result = historicalEarnings(p, history);
  assert.deepEqual(result.earnings, {profit: 19000, profitPerUnit: 19000 / 3});
  assert.equal(result.tax, 300);
  assert.equal(result.rates.length, 3);
  history.get("barcode:001").pop();
  assert.equal(historicalEarnings(p, history), null);
});

test("SKU fallback supports both Excel epochs and never supplies a price for an unknown day", () => {
  const serial = (Date.UTC(2026, 8, 1) - Date.UTC(1899, 11, 30)) / 86400000;
  const prices = new Map([["sku:A", [{valid_from:"2026-09-01", cost_cents:1200, vat_rate:20}]]]);
  const get = (day, date1904) => monthlyReport([[...orderHeaders, "Sipariş Tarihi"], [...line("1", "A", 1, 120), day]],
    [financeHeaders, finance("1",120,1)], "name", {products:date1904}).products[0];
  for (const [day, mode] of [[serial + 0.8, false], [serial - 1462, true]]) {
    const p = get(day, mode);
    assert.deepEqual(historicalEarnings(p, prices).earnings, productEarnings(p, 1200, 20));
  }
  assert.equal(historicalEarnings(get("31.02.2026", false), prices), null);
});

test("a fully returned sale still shows its freight loss without a purchase price", () => {
  const {products:[p]} = report([line("1","A",1,120)], [finance("1",120,1,{refund:-120,returnCargo:-24})]);
  assert.deepEqual(historicalEarnings(p, new Map()).earnings, {profit:-2000, profitPerUnit:null});
});

test("a returned sale contributes its signed freight, fee and penalty without consuming inventory", () => {
  const {products: [p]} = report([line("1", "A", 3, 360), line("2", "A", 1, 120, 114)], [
    finance("1", 360, 3, {cargo: -24, fee: -12, commission: -36}),
    finance("2", 120, 1, {refund: -120, cargo: -12, returnCargo: -24, penalty: -8})]);
  assert.deepEqual([p.qty, p.keptQty, p.refund, p.net, p.services, p.domesticSales], [4, 3, -12000, 24400, -10800, 36000]);
  assert.deepEqual(productEarnings(p, 2000, 20), {profit: 14200, profitPerUnit: 14200 / 3});
});

test("loss is visible with zero retained units; foreign sales, unknown adjustments and fee credits stay signed", () => {
  const {products} = report([line("1", "A", 1, 120), line("2", "B", 1, 120)], [
    finance("1", 120, 1, {refund: -120, returnCargo: -24, penalty: -8, other: 2}),
    finance("2", 120, 1, {country: "Azerbaycan", fee: 12, other: -3})]);
  const a = products.find(p => p.name === "A"), b = products.find(p => p.name === "B");
  assert.deepEqual(productEarnings(a, 9999, 20), {profit: -2600, profitPerUnit: null});
  assert.deepEqual(productEarnings(b, 1000, 20), {profit: 11700, profitPerUnit: 11700});
});

test("a visible partial refund and an already omitted cancellation reduce only their own units", () => {
  const {products: [p], totals} = report([line("R", "A", 2, 678.88), line("C", "A", 1, 339.44, 322.47)], [
    finance("R", 678.88, 2, {refund: -339.44, commission: -71.28, cargo: -98.34, returnCargo: -98.34, fee: -13.19}),
    finance("C", 678.88, 2, {cancel: -339.44, discount: -16.97, commission: -57.72, cargo: -84.49, fee: -13.19, penalty: -5})]);
  assert.deepEqual([p.qty, p.keptQty, p.refund, p.net, p.domesticSales], [3, 2, -33944, 22536, 66191]);
  assert.equal(totals.unmatchedNet, -500);
  assert.equal(totals.incomplete, 1);
});

test("multi-product return attributes the refund and return costs to the specific SKU", () => {
  const {products, totals} = report([line("R", "A", 1, 120, 108), line("R", "B", 1, 60, 60)],
    [finance("R", 180, 2, {refund: -108, discount: -12, returnCargo: -18, penalty: -7, commission: -6, fee: -3})]);
  const a = products.find(p => p.name === "A"), b = products.find(p => p.name === "B");
  assert.deepEqual([a.keptQty, a.domesticSales, a.returnCargo, a.penalty, a.net], [0, 0, -1800, -700, -2700]);
  assert.deepEqual([b.keptQty, b.domesticSales, b.returnCargo, b.commission, b.net], [1, 6000, 0, -600, 5300]);
  assert.equal(totals.net, a.net + b.net);
});

test("unidentified multi-SKU and unmatched finance movements are kept separate from earnings", () => {
  const {products, totals} = report([line("R", "A", 1, 120), line("R", "B", 1, 120), line("S", "A", 1, 120)], [
    finance("R", 240, 2, {refund: -120, returnCargo: -18}), finance("S", 120, 1), finance("F", 120, 1, {cancel: -120, penalty: -5})]);
  assert.equal(totals.ambiguous, 1);
  assert.equal(totals.missingProduct, 1);
  assert.equal(totals.unmatchedNet, 9700);
  assert.equal(totals.net, 12000);
  assert.ok(products.every(p => p.incomplete && !productEarnings(p, 0, 20)));
});

test("unresolved unit count or a conflicting unpaid refund keeps the order's known net but leaves profit blank", () => {
  for (const [refund, status] of [[-11, "Teslim Edildi"], [0, "İade Edildi"]]) {
    const {products: [p]} = report([line("R", "A", 2, 120, 120, status)], [finance("R", 120, 2, {refund})]);
    assert.equal(p.net, (120 + refund) * 100);
    assert.equal(p.keptQty, null);
    assert.equal(productEarnings(p, 0, 20), null);
  }
});

test("mixed return and cancellation use only the explicitly returned product for return freight", () => {
  const {products} = report([line("M", "A", 1, 100, 100, "İade Edildi"), line("M", "B", 1, 100, 100, "İptal Edildi")],
    [finance("M", 200, 2, {refund: -100, cancel: -100, returnCargo: -18})]);
  assert.equal(products.find(p => p.name === "A").returnCargo, -1800);
  assert.equal(products.find(p => p.name === "B").returnCargo, 0);
});
