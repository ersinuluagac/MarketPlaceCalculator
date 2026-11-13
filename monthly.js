const productHeaders = ["Sipariş Numarası", "Stok Kodu", "Ürün Adı", "Adet", "Satış Tutarı"];
const financeHeaders = ["Sipariş No", "Net Tutar", "Gönderi Kargo Bedeli", "Platform Hizmet Bedeli"];

function rowsWithHeaders(rows, headers, sheet) {
  const index = rows.findIndex(row => headers.every(title => row.includes(title)));
  if (index < 0) throw Error(sheet + " sayfasında beklenen sütunlar bulunamadı: " + headers.join(", "));
  const columns = headers.map(title => rows[index].indexOf(title));
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
  for (const [key, sku, name, quantity, sales] of rowsWithHeaders(productRows, productHeaders, "Giris_Urunler")) {
    if (!id(key) || !id(name)) throw Error("Sipariş numarası veya ürün adı eksik.");
    const qty = number(quantity, "Adet");
    const gross = cents(sales, "Satış Tutarı");
    if (!Number.isSafeInteger(qty) || qty < 1 || gross < 0) throw Error("Adet veya satış tutarı dağıtıma uygun değil.");
    if (!orders.has(id(key))) orders.set(id(key), []);
    orders.get(id(key)).push({ sku: id(sku), name: id(name), qty, gross });
  }
  for (const [key, net, cargo, fee] of rowsWithHeaders(financeRows, financeHeaders, "Giris_Finans")) {
    if (!id(key) || finance.has(id(key))) throw Error("Finansta boş veya tekrarlanan sipariş numarası var. Her sipariş için tek finans özeti gerekiyor.");
    finance.set(id(key), { net: cents(net, "Net Tutar"), cargo: cents(cargo, "Gönderi Kargo Bedeli"), fee: cents(fee, "Platform Hizmet Bedeli") });
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
    let previous = 0;
    for (const {name, sku, qty, gross} of lines) {
      const productKey = groupBy === "sku" ? (sku ? "sku:" + sku : "name:" + name) : name;
      const p = products.get(productKey) ?? { name, sku, qty: 0, gross: 0, net: 0, fee: 0, cargo: 0 };
      p.qty += qty;
      totals.qty += qty;
      p.gross += gross;
      // Cumulative rounding assigns each order's exact final cent once.
      for (const field of ["net", "cargo", "fee"]) {
        const part = entry[field];
        p[field] += Math.round(part * (previous + gross) / weight) - Math.round(part * previous / weight);
      }
      previous += gross;
      products.set(productKey, p);
    }
  }
  return { totals, products: [...products.values()].sort((a,b) => b.net - a.net || a.name.localeCompare(b.name, "tr")) };
}
