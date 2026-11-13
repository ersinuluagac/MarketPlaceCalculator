import test from "node:test";
import assert from "node:assert/strict";
import { resolveReturnedUnits } from "../return-lines.js";

const line = (qty, gross, invoice = gross, status = "Teslim Edildi") => ({qty, gross, invoice, status});

test("four partially returned September orders reconcile to named products and whole units", () => {
  const cases = [
    [[line(1, 34900, 32806), line(6, 13014, 12234), line(1, 34900, 32806)], 69800, [1, 0, 1], [34900, 0, 34900]],
    [[line(2, 67888)], 33944, [1], [33944]],
    [[line(1, 12356, 12194), line(1, 41449, 40903), line(1, 31147, 30737), line(1, 11944, 11787)],
      72596, [0, 1, 1, 0], [0, 41449, 31147, 0]],
    [[line(3, 22350)], 7450, [1], [7450]]
  ];
  for (const [lines, refund, qty, amounts] of cases) {
    assert.deepEqual(resolveReturnedUnits(lines, refund), {qty, amounts});
  }
});

test("full and partial discounted refunds use the matching price basis", () => {
  assert.deepEqual(resolveReturnedUnits([line(1, 33944, 32247)], 33944), {qty: [1], amounts: [33944]});
  assert.deepEqual(resolveReturnedUnits([line(2, 8000, 7200)], 3600), {qty: [1], amounts: [3600]});
  assert.deepEqual(resolveReturnedUnits([line(4, 238)], 119), {qty: [2], amounts: [119]});
  assert.equal(resolveReturnedUnits([line(3, 100)], 33), null);
});

test("equal prices require evidence of which product was returned", () => {
  const lines = [line(1, 200), line(1, 200)];
  assert.equal(resolveReturnedUnits(lines, 200), null);
  const marked = Object.freeze({...lines[1], status: "İade edildi"});
  assert.deepEqual(resolveReturnedUnits(Object.freeze([lines[0], marked]), 200), {qty: [0, 1], amounts: [0, 200]});
});

test("unknown amounts stay unresolved and huge unit counts do not require expanding units", () => {
  assert.equal(resolveReturnedUnits([line(2, 600)], 237), null);
  assert.equal(resolveReturnedUnits([line(1, 500)], -500), null);
  assert.deepEqual(resolveReturnedUnits([line(1, 500)], 0), {qty: [0], amounts: [0]});
  assert.deepEqual(resolveReturnedUnits([line(1000000000, 3000000000)], 300000),
    {qty: [100000], amounts: [300000]});
  assert.equal(resolveReturnedUnits([line(1, 0), line(1, 500)], 500), null);
});
