import { listRoles, monthlyReport, productEarnings } from "./monthly.js";

const get = id => document.getElementById(id);
const money = new Intl.NumberFormat("tr-TR", {style: "currency", currency: "TRY"});
const price = cents => money.format(cents / 100);
const count = value => value.toLocaleString("tr-TR");
let input = {};
const costs = new Map();
const labels = { products: "Sipariş listesi", finances: "Finans listesi" };

try {
  document.documentElement.dataset.theme = localStorage.getItem("calculator_theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch { /* Storage is optional. */ }

function amountPair(cell, total, qty) {
  cell.replaceChildren();
  if (total == null) { cell.textContent = "—"; return; }
  cell.append(price(total));
  if (qty > 0) detail(cell, price(total / qty) + " / adet");
}

function detail(cell, text) {
  const note = document.createElement("small");
  note.textContent = text;
  cell.append(note);
}

function render() {
  const mode = get("group").value;
  const { totals, products } = monthlyReport(input.products.rows, input.finances.rows, mode);
  get("orders").textContent = count(totals.matched);
  get("qty").textContent = count(totals.qty);
  get("net").textContent = price(totals.net);
  get("unmatchedNet").textContent = price(totals.unmatchedNet);
  const coverage = [];
  if (totals.missingProduct) coverage.push(count(totals.missingProduct) + " sipariş yalnızca finans listesinde yer alıyor.");
  if (totals.missingFinance) coverage.push(count(totals.missingFinance) + " siparişin finans kaydı yok.");
  if (totals.unallocated) coverage.push(count(totals.unallocated) + " siparişte satış tutarı sıfır olduğu için dağıtım yapılamadı.");
  if (totals.incomplete) coverage.push(count(totals.incomplete) + " siparişte ürün satırları eksik.");
  if (totals.ambiguous) coverage.push(count(totals.ambiguous) + " çok ürünlü siparişte iade veya iptalin hangi ürüne ait olduğu belirlenemedi. Bu siparişlerin net tutarı dağıtılamayan tutara dahil.");
  get("coverage").textContent = coverage.join(" ");
  get("keyTitle").textContent = mode === "sku" ? "Stok kodu / ürün" : "Ürün adı";
  const body = document.createDocumentFragment();
  const showTax = get("withholding").checked;
  get("taxHead").hidden = get("taxNote").hidden = !showTax;
  for (const p of products) {
    const row = document.createElement("tr");
    const label = mode === "sku" && p.sku ? p.sku + " · " + p.name : p.name;
    row.insertCell().textContent = label;
    const quantity = row.insertCell();
    const unallocated = p.incomplete && p.qty === 0;
    quantity.textContent = unallocated ? "—" : count(p.qty) + " adet";
    if (!unallocated) {
      if (p.keptQty == null) {
        detail(quantity, count(p.unknownQty) + " adette iade sayısı belirsiz");
      } else {
        detail(quantity, count(p.qty - p.keptQty) + " iade/iptal");
        detail(quantity, count(p.keptQty) + " net satış");
      }
    }
    for (const total of [p.gross, p.refund, p.cargo, p.returnCargo, p.commission, p.fee, p.penalty, p.net]) {
      amountPair(row.insertCell(), unallocated ? null : total, p.qty);
    }
    const costKey = mode + ":" + p.key;
    const saved = costs.get(costKey) ?? {cost: "", vat: ""};
    const cost = document.createElement("input");
    cost.type = "number";
    cost.min = "0";
    cost.step = "0.01";
    cost.inputMode = "decimal";
    cost.placeholder = "₺";
    cost.setAttribute("aria-label", label + " adet alış fiyatı");
    cost.value = saved.cost;
    row.insertCell().append(cost);
    const vat = document.createElement("select");
    vat.setAttribute("aria-label", label + " KDV oranı");
    vat.add(new Option("Seçin", ""));
    for (const rate of [0, 1, 10, 20]) vat.add(new Option("%" + rate, String(rate)));
    vat.value = saved.vat;
    row.insertCell().append(vat);
    const tax = row.insertCell();
    tax.hidden = !showTax;
    const profit = row.insertCell();
    const total = row.insertCell();
    function update() {
      const hasVat = vat.value !== "";
      const factor = 1 + Number(vat.value) / 100;
      const ready = hasVat && cost.value !== "" && cost.validity.valid;
      const earnings = ready ? productEarnings(p, Math.round(cost.valueAsNumber * 100), Number(vat.value)) : null;
      profit.textContent = earnings?.profitPerUnit == null ? "—" : price(earnings.profitPerUnit);
      total.textContent = earnings?.profit == null ? "—" : price(earnings.profit);
      if (p.incomplete) detail(total, "Ürüne dağıtılamayan sipariş var");
      else if (p.keptQty == null) detail(total, "İade adedi belirsiz");
      else if (ready && earnings?.profit == null) detail(total, "Eksik veri");
      if (showTax) {
        tax.textContent = hasVat && p.taxQty ? price(Math.round(p.taxGross / factor / 100)) : "—";
        if (!unallocated) detail(tax, count(p.taxQty) + " adet kapsamda");
      }
    }
    function saveCost() {
      costs.set(costKey, {cost: cost.value, vat: vat.value});
      update();
    }
    cost.addEventListener("input", saveCost);
    vat.addEventListener("change", saveCost);
    update();
    body.append(row);
  }
  get("items").replaceChildren(body);
  get("results").hidden = false;
}

function showSources() {
  for (const [role, label] of Object.entries(labels)) {
    const source = input[role];
    get(role + "Source").textContent = source ? label + ": " + source.name : label + " bekleniyor";
  }
  get("clearFiles").hidden = !Object.keys(input).length;
}

function reset() {
  costs.clear();
  input = {};
  get("results").hidden = true;
  get("items").replaceChildren();
  get("file").value = "";
  get("status").textContent = "";
  showSources();
}

async function readLists(file) {
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength < 4 || new DataView(bytes).getUint32(0) !== 0x504b0304)
    throw Error(file.name + " geçerli bir .xlsx dosyası değil.");
  const options = { type: "array", cellFormula: false, dense: true };
  const book = XLSX.read(bytes, options);
  const found = {};
  for (const name of book.SheetNames) {
    const sheet = book.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, {header: 1, blankrows: false});
    for (const role of listRoles(rows)) {
      if (found[role]) throw Error(file.name + " içinde birden fazla " + labels[role].toLocaleLowerCase("tr") + " bulundu.");
      found[role] = { rows, name: file.name + " · " + name };
    }
  }
  if (!Object.keys(found).length) {
    throw Error(file.name + " içinde sipariş veya finans başlıkları bulunamadı. Sipariş listesinde Ürün Adı ve Satış Tutarı, finans listesinde Net Tutar ve Platform Hizmet Bedeli bulunmalı.");
  }
  return found;
}

get("clearFiles").addEventListener("click", reset);
get("group").addEventListener("change", () => { if (!get("results").hidden) render(); });
get("withholding").addEventListener("change", () => { if (!get("results").hidden) render(); });
get("file").addEventListener("change", async event => {
  const files = [...event.target.files];
  if (!files.length) return;
  if (input.products && input.finances) reset();
  get("file").disabled = true;
  get("clearFiles").disabled = true;
  get("results").hidden = true;
  get("status").textContent = "Listeler okunuyor…";
  try {
    const batch = {};
    for (const file of files) {
      const found = await readLists(file);
      for (const [role, source] of Object.entries(found)) {
        if (batch[role]) throw Error("Aynı anda iki " + labels[role].toLocaleLowerCase("tr") + " seçildi. Her türden bir liste seçin.");
        batch[role] = source;
      }
    }
    Object.assign(input, batch);
    if (input.products && input.finances) {
      render();
      get("status").textContent = "Listeler sipariş numarasıyla eşleştirildi.";
    } else {
      get("status").textContent = input.products ? "Devam etmek için finans listesini seçin." : "Devam etmek için sipariş listesini seçin.";
    }
  } catch (error) {
    get("status").textContent = "Rapor oluşturulamadı. " + error.message;
  } finally {
    showSources();
    get("file").value = "";
    get("file").disabled = false;
    get("clearFiles").disabled = false;
  }
});
