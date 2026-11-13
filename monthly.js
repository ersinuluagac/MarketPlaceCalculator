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

export function monthlyReport(productRows, financeRows, groupBy = "name") {
  const orders = new Map();
  const finance = new Map();
  for (const [key, sku, name, quantity, sales, invoice, status] of rowsWithHeaders(productRows, productHeaders, "Giris_Urunler", ["Faturalanacak Tutar", "Sipariş Statüsü"])) {
    if (!id(key) || !id(name)) throw Error("Sipariş numarası veya ürün adı eksik.");
    const qty = number(quantity, "Adet");
    const gross = cents(sales, "Satış Tutarı");
    if (!Number.isSafeInteger(qty) || qty < 1 || gross < 0) throw Error("Adet veya satış tutarı dağıtıma uygun değil.");
    if (!orders.has(id(key))) orders.set(id(key), []);
    orders.get(id(key)).push({ sku: id(sku), name: id(name), qty, gross,
      invoice: invoice == null || invoice === "" ? null : cents(invoice, "Faturalanacak Tutar"), status });
  }
  const extraHeaders = ["Komisyon/Yurt Dışı Stok Destek Bedeli", "İade Kargo Bedeli", "Ülke", "Sipariş Statüsü", "İade", "İptal", "Ödeme Yöntemi"];
  for (const [key, net, cargo, fee, commission, returnCargo, country, status, refund, cancel, payment] of rowsWithHeaders(financeRows, financeHeaders, "Giris_Finans", extraHeaders)) {
    if (!id(key) || finance.has(id(key))) throw Error("Finansta boş veya tekrarlanan sipariş numarası var. Her sipariş için tek finans özeti gerekiyor.");
    finance.set(id(key), { net: cents(net, "Net Tutar"), cargo: cents(cargo, "Gönderi Kargo Bedeli"),
      returnCargo: returnCargo == null || returnCargo === "" ? null : cents(returnCargo, "İade Kargo Bedeli"),
      commission: commission == null || commission === "" ? null : cents(commission, "Komisyon"),
      fee: cents(fee, "Platform Hizmet Bedeli"),
      domesticSale: country === "Türkiye" && status === "Teslim Edildi" && Number(refund) === 0 && Number(cancel) === 0,
      estimateTax: country === "Türkiye" && status === "Teslim Edildi" && Number(refund) === 0 && Number(cancel) === 0
        && ["Kredi Kartı", "Alışveriş Kredisi"].includes(payment) });
  }
  const products = new Map();
  const totals = { matched: 0, missingFinance: 0, missingProduct: 0, unallocated: 0, net: 0, fee: 0, cargo: 0, qty: 0 };
  for (const key of finance.keys()) if (!orders.has(key)) totals.missingProduct++;
  for (const [key, lines] of orders) {
    const entry = finance.get(key);
    if (!entry) { totals.missingFinance++; continue; }
    const weight = lines.reduce((sum, line) => sum + line.gross, 0);
    if (weight === 0) { totals.unallocated++; continue; }
    totals.matched++;
    totals.net += entry.net;
    totals.fee += entry.fee;
    totals.cargo += entry.cargo;
    const invoiceTotal = lines.reduce((sum, line) => sum + (line.invoice ?? 0), 0);
    const canEstimateProfit = entry.domesticSale && entry.commission !== null && entry.returnCargo !== null
      && lines.every(line => line.invoice !== null && line.status === "Teslim Edildi")
      && invoiceTotal + entry.cargo + entry.returnCargo + entry.commission + entry.fee === entry.net;
    let previous = 0;
    for (const {name, sku, qty, gross, invoice, status} of lines) {
      const productKey = groupBy === "sku" ? (sku ? "sku:" + sku : "name:" + name) : name;
      const p = products.get(productKey) ?? { key: productKey, name, sku, qty: 0, gross: 0, net: 0, fee: 0, cargo: 0, returnCargo: 0, commission: 0, taxGross: 0, taxQty: 0, profitInvoice: 0, profitFees: 0, profitQty: 0 };
      if (canEstimateProfit) {
        p.profitInvoice += invoice;
        p.profitQty += qty;
      }
      p.qty += qty;
      totals.qty += qty;
      p.gross += gross;
      if (entry.estimateTax && status === "Teslim Edildi" && invoice != null && invoice >= 0) {
        p.taxGross += invoice;
        p.taxQty += qty;
      }
      // Cumulative rounding assigns each order's exact final cent once.
      for (const field of ["net", "cargo", "returnCargo", "fee", "commission"]) {
        const part = entry[field];
        if (part === null) { p[field] = null; continue; }
        const share = Math.round(part * (previous + gross) / weight) - Math.round(part * previous / weight);
        if (p[field] !== null) p[field] += share;
        if (canEstimateProfit && field !== "net") p.profitFees += share;
      }
      previous += gross;
      products.set(productKey, p);
    }
  }
  return { totals, products: [...products.values()].sort((a,b) => b.net - a.net || a.name.localeCompare(b.name, "tr")) };
}
