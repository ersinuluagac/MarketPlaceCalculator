import { resolveReturnedUnits } from "./return-lines.js";

const productHeaders = ["Sipariş Numarası", "Stok Kodu", "Ürün Adı", "Adet", "Satış Tutarı"];
const financeHeaders = ["Sipariş No", "Net Tutar", "Gönderi Kargo Bedeli", "Platform Hizmet Bedeli"];

function headerKey(value) {
  return String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

function findHeaders(rows, headers) {
  const required = headers.map(headerKey);
  for (const [index, row] of rows.entries()) {
    if (row.length < required.length) continue;
    const titles = row.map(headerKey);
    const columns = required.map(key => titles.indexOf(key));
    if (columns.every(column => column >= 0)) return { index, columns };
  }
}

export function listRoles(rows) {
  const roles = [];
  if (findHeaders(rows, productHeaders)) roles.push("products");
  if (findHeaders(rows, financeHeaders)) roles.push("finances");
  return roles;
}

function rowsWithHeaders(rows, headers, sheet, optional = []) {
  const match = findHeaders(rows, headers);
  if (!match) throw Error(sheet + " listesinde beklenen sütunlar bulunamadı: " + headers.join(", "));
  const {index, columns} = match;
  const titles = rows[index].map(headerKey);
  for (const title of optional) columns.push(titles.indexOf(headerKey(title)));
  return rows.slice(index + 1)
    .map(row => columns.map(i => row[i]))
    .filter(row => row.some(value => value != null && value !== ""));
}

function number(value, label) {
  let text = String(value ?? "").trim();
  if (text.includes(",")) text = text.replaceAll(".", "").replace(",", ".");
  const result = Number(text);
  if (!text || !Number.isFinite(result)) throw Error(label + " alanında eksik veya geçersiz sayı var.");
  return result;
}
const cents = (value, label) => Math.round(number(value, label) * 100);
const id = value => String(value ?? "").trim();

function orderDay(value, date1904) {
  if (typeof value === "number" && date1904) value += 1462;
  if (typeof value === "number" && Number.isFinite(value) && value >= 61 && value < 2958466)
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
  const parts = id(value).split(/[ T]/)[0];
  const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(parts);
  const iso = local ? local[3] + "-" + local[2].padStart(2, "0") + "-" + local[1].padStart(2, "0") : parts;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(+date) && date.toISOString().startsWith(iso) ? iso : "";
}

// Monetary inputs and outputs are in kuruş. A returned item goes back into stock.
export function productEarnings(product, costCents, vatPercent) {
  if (product.incomplete || !product.profitReady || product.keptQty == null ||
      !Number.isSafeInteger(costCents) || costCents < 0 || ![0, 1, 10, 20].includes(vatPercent)) return null;
  return profitAfterCosts(product, product.keptQty * costCents, product.domesticSales * vatPercent / (100 + vatPercent));
}

function profitAfterCosts(product, purchases, salesVat) {
  const serviceVat = product.services * 20 / 120; // Expenses are signed (normally negative).
  const profit = Math.round(product.net - salesVat - serviceVat - purchases);
  return {profit, profitPerUnit: product.keptQty ? profit / product.keptQty : null};
}

// Each list is in descending effective-date order.
export function historicalEarnings(product, history) {
  let purchases = 0, salesVat = 0, taxBase = 0;
  const used = new Map();
  for (const line of product.costLines) {
    if (!line.qty && !line.sales && !line.taxGross) continue;
    const rate = line.day && history.get(line.productKey)?.find(record => record.valid_from <= line.day);
    if (!rate) return null;
    purchases += line.qty * rate.cost_cents;
    salesVat += line.sales * rate.vat_rate / (100 + rate.vat_rate);
    taxBase += line.taxGross * 100 / (100 + rate.vat_rate);
    used.set(rate.cost_cents + "/" + rate.vat_rate, rate);
  }
  if (!product.costLines.length) return null;
  const earnings = product.profitReady && !product.incomplete && product.keptQty != null
    ? profitAfterCosts(product, purchases, salesVat) : null;
  return {earnings, rates: [...used.values()], tax: Math.round(taxBase / 100)};
}

const optionalCents = (v, label) => v == null || v === "" ? null : cents(v, label);
const sum = values => values.reduce((total, value) => total + value, 0);

// Cumulative rounding preserves the order total, including negative fees and credits.
function split(amount, weights) {
  const total = sum(weights);
  if (!total) {
    if (amount) throw Error("Tutarı dağıtmak için geçerli ürün payı bulunamadı.");
    return weights.map(() => 0);
  }
  let cumulative = 0, assigned = 0;
  return weights.map(weight => {
    cumulative += weight;
    const rounded = Math.round(amount * cumulative / total);
    const share = rounded - assigned;
    assigned = rounded;
    return share;
  });
}

function readFinances(rows, date1904) {
  const optional = ["Komisyon/Yurt Dışı Stok Destek Bedeli", "İade Kargo Bedeli", "Ülke", "Sipariş Statüsü",
    "İade", "İptal", "Ödeme Yöntemi", "Ürün Adedi", "Sipariş Tutarı", "İndirim", "Ceza Bedeli", "Sipariş Tarihi"];
  const finance = new Map();
  for (const [key, net, cargo, fee, commission, returnCargo, country, status, refund, cancel,
    payment, qty, gross, discount, penalty, date] of rowsWithHeaders(rows, financeHeaders, "Finans", optional)) {
    if (!id(key) || finance.has(id(key))) throw Error("Finansta boş veya tekrarlanan sipariş numarası var. Her sipariş için tek finans özeti gerekiyor.");
    finance.set(id(key), { day: orderDay(date, date1904), net: cents(net, "Net Tutar"), cargo: cents(cargo, "Gönderi Kargo Bedeli"),
      fee: cents(fee, "Platform Hizmet Bedeli"), commission: optionalCents(commission, "Komisyon"),
      returnCargo: optionalCents(returnCargo, "İade Kargo Bedeli"), penalty: optionalCents(penalty, "Ceza Bedeli"),
      country: headerKey(country), status: headerKey(status), payment, qty: id(qty) ? number(qty, "Ürün Adedi") : null,
      gross: optionalCents(gross, "Sipariş Tutarı"), discount: optionalCents(discount, "İndirim"),
      refund: optionalCents(refund, "İade"), cancel: optionalCents(cancel, "İptal") });
  }
  return finance;
}

function getProduct(products, line, groupBy) {
  const key = groupBy === "sku" ? (line.sku ? "sku:" + line.sku : "name:" + line.name) : line.name;
  if (!products.has(key)) products.set(key, {key, sku: line.sku, name: line.name, qty: 0, keptQty: 0,
    unknownQty: 0, incomplete: false, gross: 0, refund: 0, cargo: 0, returnCargo: 0, commission: 0,
    fee: 0, penalty: 0, net: 0, taxGross: 0, taxQty: 0, domesticSales: 0, services: 0, profitReady: true, costLines: []});
  return products.get(key);
}

function addAmount(product, field, amount) {
  if (amount == null) product[field] = null;
  else if (product[field] != null) product[field] += amount;
}

function allocateOrder(lines, entry, products, totals) {
  const gross = lines.map(line => line.gross);
  const listed = sum(gross);
  const qty = sum(lines.map(line => line.qty));
  const single = products.every(p => p === products[0]);
  const weights = listed ? gross : lines.map(line => line.qty);
  const missingGross = entry.gross == null ? 0 : entry.gross - listed;
  const missingRows = missingGross !== 0 || (entry.qty != null && entry.qty !== qty);
  // Some exports omit already cancelled lines. They have no remaining revenue or COGS.
  const omittedCancel = missingGross > 0 && -entry.cancel === missingGross && (entry.qty == null || entry.qty > qty);
  if (missingRows) totals.incomplete++;
  if ((missingRows && !omittedCancel) || (!listed && !single)) {
    if (!listed) totals.unallocated++;
    return false;
  }

  const cancellation = omittedCancel ? 0 : (entry.cancel ?? 0);
  const reversal = (entry.refund ?? 0) + cancellation;
  const pendingReversal = reversal === 0 && !omittedCancel &&
    [entry.status, ...lines.map(line => line.status)].some(s => s === "iade edildi" || s === "iptal edildi");
  const returned = reversal <= 0 && !pendingReversal ? resolveReturnedUnits(lines, -reversal) : null;
  if (!returned && !single) { totals.ambiguous++; return false; }
  const amounts = returned ? returned.amounts : split(-reversal, weights);
  const salesBeforeDiscount = gross.map((v, i) => v - amounts[i]);
  // A discounted refund can equal the invoice rather than the original gross price.
  const retainedGross = lines.map((l, i) => returned ? l.gross - Math.round(l.gross * returned.qty[i] / l.qty) : l.gross);
  const retainedWeights = sum(retainedGross) ? retainedGross : weights;
  const discount = entry.discount ?? 0;
  // When the refund is at the discounted price, part of the order discount
  // belongs to the returned units. Their gross less refund must net to zero.
  const reversedDiscount = salesBeforeDiscount.map((v, i) => retainedGross[i] - v);
  const retainedDiscount = discount - sum(reversedDiscount);
  const lineDiscount = lines.map((l, i) => l.invoice == null ? null :
    Math.round((l.invoice - l.gross) * (returned ? (l.qty - returned.qty[i]) / l.qty : 1)));
  const applied = lineDiscount.every(d => d != null) && sum(lineDiscount) === retainedDiscount
    ? lineDiscount : split(retainedDiscount, retainedWeights);
  const sales = salesBeforeDiscount.map((amount, i) => amount + reversedDiscount[i] + applied[i]);
  const refundedWeights = sum(amounts) > 0 && amounts.every(n => n >= 0) ? amounts : weights;
  // If both cancellation and return are visible, isolate the actual return freight when possible.
  let freightWeights = refundedWeights;
  if (entry.refund < 0 && cancellation < 0) {
    const candidates = lines.map((line, i) => ({line, i})).filter(({line}) => line.status !== "iptal edildi");
    const refundOnly = resolveReturnedUnits(candidates.map(({line}) => line), -entry.refund);
    if (refundOnly) {
      freightWeights = lines.map(() => 0);
      candidates.forEach(({i}, j) => { freightWeights[i] = refundOnly.amounts[j]; });
    }
    else if (!single && entry.returnCargo) { totals.ambiguous++; return false; }
  }
  const shipping = split(entry.cargo, weights);
  const fees = split(entry.fee, weights);
  const commission = split(entry.commission ?? 0, retainedWeights);
  // An absent cancelled product cannot be charged to a visible retained item.
  const missingPenalty = omittedCancel ? (entry.penalty ?? 0) : 0;
  const missingFreight = omittedCancel && !entry.refund ? (entry.returnCargo ?? 0) : 0;
  const returnCargo = split((entry.returnCargo ?? 0) - missingFreight, freightWeights);
  const penalty = split((entry.penalty ?? 0) - missingPenalty, refundedWeights);
  const unassigned = missingPenalty + missingFreight;
  const net = sales.map((v, i) => v + shipping[i] + returnCargo[i] + commission[i] + fees[i] + penalty[i]);
  const other = split(entry.net - unassigned - sum(net), weights);
  const identified = entry.cancel != null && entry.refund != null;
  const canEstimate = identified && entry.country && entry.gross != null && entry.discount != null &&
    entry.commission != null && entry.returnCargo != null;
  for (const [i, line] of lines.entries()) {
    const p = products[i];
    p.qty += line.qty;
    if (returned && identified) {
      if (p.keptQty != null) p.keptQty += line.qty - returned.qty[i];
    } else {
      p.keptQty = null;
      p.unknownQty += line.qty;
    }
    p.gross += line.gross;
    p.net += net[i] + other[i];
    p.cargo += shipping[i];
    p.fee += fees[i];
    addAmount(p, "refund", identified ? -amounts[i] : null);
    addAmount(p, "returnCargo", entry.returnCargo == null ? null : returnCargo[i]);
    addAmount(p, "commission", entry.commission == null ? null : commission[i]);
    addAmount(p, "penalty", entry.penalty == null ? null : penalty[i]);
    p.profitReady &&= Boolean(canEstimate);
    if (entry.country === "türkiye") p.domesticSales += sales[i];
    p.services += shipping[i] + returnCargo[i] + commission[i] + fees[i];
    const costLine = {productKey: line.productKey, day: entry.day || line.day, qty: returned ? line.qty - returned.qty[i] : 0,
      sales: entry.country === "türkiye" ? sales[i] : 0, taxGross: 0};
    p.costLines.push(costLine);
    if (identified && entry.country === "türkiye" && entry.status === "teslim edildi" && !entry.refund && !entry.cancel &&
        ["Kredi Kartı", "Alışveriş Kredisi"].includes(entry.payment) && line.status === "teslim edildi" && line.invoice != null && line.invoice >= 0) {
      p.taxQty += line.qty;
      p.taxGross += line.invoice;
      costLine.taxGross = line.invoice;
    }
  }
  totals.matched++;
  totals.qty += qty;
  totals.net += entry.net - unassigned;
  totals.fee += entry.fee;
  totals.cargo += entry.cargo;
  totals.unmatchedNet += unassigned;
  return true;
}

export function monthlyReport(productRows, financeRows, groupBy = "name", dateSystems = {}) {
  const orders = new Map();
  for (const [key, sku, name, quantity, sales, invoice, status, barcode, date] of rowsWithHeaders(productRows, productHeaders, "Sipariş", ["Faturalanacak Tutar", "Sipariş Statüsü", "Barkod", "Sipariş Tarihi"])) {
    if (!id(key) || !id(name)) throw Error("Sipariş numarası veya ürün adı eksik.");
    const qty = number(quantity, "Adet");
    const gross = cents(sales, "Satış Tutarı");
    if (!Number.isSafeInteger(qty) || qty < 1 || gross < 0) throw Error("Adet veya satış tutarı dağıtıma uygun değil.");
    if (!orders.has(id(key))) orders.set(id(key), []);
    const productKey = id(barcode) ? "barcode:" + id(barcode) : (id(sku) ? "sku:" + id(sku) : "");
    orders.get(id(key)).push({sku: id(sku), name: id(name), productKey, day: orderDay(date, dateSystems.products), qty, gross, invoice: optionalCents(invoice, "Faturalanacak Tutar"), status: headerKey(status)});
  }
  const finance = readFinances(financeRows, dateSystems.finances);
  const products = new Map();
  const totals = {matched: 0, missingFinance: 0, missingProduct: 0, unallocated: 0, incomplete: 0,
    ambiguous: 0, net: 0, unmatchedNet: 0, fee: 0, cargo: 0, qty: 0};
  for (const [key, lines] of orders) {
    if (finance.has(key)) continue;
    totals.missingFinance++;
    for (const line of lines) getProduct(products, line, groupBy).incomplete = true;
  }
  for (const [key, entry] of finance) {
    const lines = orders.get(key);
    if (!lines) { totals.missingProduct++; totals.unmatchedNet += entry.net; continue; }
    const items = lines.map(line => getProduct(products, line, groupBy));
    if (!allocateOrder(lines, entry, items, totals)) {
      totals.unmatchedNet += entry.net;
      for (const p of items) p.incomplete = true;
    }
  }
  return {totals, products: [...products.values()].sort((a, b) => b.net - a.net || a.name.localeCompare(b.name, "tr"))};
}
