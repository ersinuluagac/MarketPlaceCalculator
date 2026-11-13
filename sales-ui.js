import { listRoles, monthlyReport } from "./monthly.js";

const get = id => document.getElementById(id);
const money = new Intl.NumberFormat("tr-TR", {style: "currency", currency: "TRY"});
const price = cents => money.format(cents / 100);
const count = value => value.toLocaleString("tr-TR");
let input = {};
const labels = { products: "Sipariş listesi", finances: "Finans listesi" };

try {
  document.documentElement.dataset.theme = localStorage.getItem("calculator_theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch { /* Storage is optional. */ }

function render() {
  const mode = get("group").value;
  const { totals, products } = monthlyReport(input.products.rows, input.finances.rows, mode);
  get("orders").textContent = count(totals.matched);
  get("qty").textContent = count(totals.qty);
  get("net").textContent = price(totals.net);
  get("coverage").textContent = "Toplamlara dahil edilmeyen siparişler: yalnız finansta " + count(totals.missingProduct)
    + ", yalnız ürün listesinde " + count(totals.missingFinance) + ", satış toplamı sıfır " + count(totals.unallocated) + ".";
  get("keyTitle").textContent = mode === "sku" ? "Stok kodu / ürün" : "Ürün adı";
  const body = document.createDocumentFragment();
  for (const p of products) {
    const row = document.createElement("tr");
    const label = mode === "sku" && p.sku ? p.sku + " · " + p.name : p.name;
    for (const value of [label, count(p.qty), price(p.net / p.qty), price(p.net), price(p.cargo), price(p.fee)]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
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
