import { monthlyReport } from "./monthly.js";

const get = id => document.getElementById(id);
const money = new Intl.NumberFormat("tr-TR", {style: "currency", currency: "TRY"});
const price = cents => money.format(cents / 100);
const count = value => value.toLocaleString("tr-TR");
let input;
let generation = 0;

try {
  document.documentElement.dataset.theme = localStorage.getItem("calculator_theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch { /* Storage is optional. */ }

function render() {
  const mode = get("group").value;
  const { totals, products } = monthlyReport(input.products, input.finances, mode);
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

get("group").addEventListener("change", () => { if (input) render(); });
get("file").addEventListener("change", async event => {
  const ticket = ++generation;
  const file = event.target.files[0];
  get("results").hidden = true;
  input = null;
  get("status").textContent = file ? "Dosya okunuyor…" : "";
  if (!file) return;
  try {
    const bytes = await file.arrayBuffer();
    if (ticket !== generation) return;
    if (new DataView(bytes).byteLength < 4 || new DataView(bytes).getUint32(0) !== 0x504b0304)
      throw Error("Dosya geçerli bir .xlsx çalışma kitabı değil.");
    const book = XLSX.read(bytes, {type: "array", sheets: ["Giris_Urunler", "Giris_Finans"], cellFormula: false, dense: true});
    function sheetRows(name) {
      if (!book.Sheets[name]) throw Error(name + " sayfası bulunamadı.");
      return XLSX.utils.sheet_to_json(book.Sheets[name], {header: 1, blankrows: false});
    }
    input = {products: sheetRows("Giris_Urunler"), finances: sheetRows("Giris_Finans")};
    render();
    get("status").textContent = "Dosya işlendi.";
  } catch (error) {
    input = null;
    get("status").textContent = "Rapor oluşturulamadı. " + error.message;
  }
});
