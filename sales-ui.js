import { listRoles, monthlyReport, productEarnings, historicalEarnings } from "./monthly.js";
import { sampleReport } from "./sample-report.js";

const get = id => document.getElementById(id);
const money = new Intl.NumberFormat("tr-TR", {style: "currency", currency: "TRY"});
const price = cents => money.format(cents / 100);
const count = value => value.toLocaleString("tr-TR");
let input = {};
let report, reportGroup;
let showingSample = false;
const costs = new Map();
let accountId = null, history = null, saveAccountCost;
const labels = { products: "Sipariş listesi", finances: "Finans listesi" };

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

function editCost(p, keys, draft) {
  const editor = get("costEditor"), form = get("costForm");
  const {product, day, cost, vat} = form.elements;
  const owner = accountId;
  get("editorName").textContent = p.name;
  get("editorStatus").textContent = "";
  product.replaceChildren(...keys.map(key => new Option(key.startsWith("sku:") ? "Stok · " + key.slice(4) : "Barkod · " + key.slice(8), key)));
  function fill() {
    const rate = history?.get(product.value)?.find(r => r.valid_from <= day.value);
    cost.value = rate ? rate.cost_cents / 100 : draft.cost;
    vat.value = rate ? rate.vat_rate : draft.vat;
  }
  function chooseProduct() {
    const days = p.costLines.filter(l => l.productKey === product.value && l.day).map(l => l.day).sort();
    const dates = history?.get(product.value) || [];
    const today = new Date().toLocaleDateString("sv-SE");
    day.value = days[0] && !dates.some(r => r.valid_from <= days[0]) ? days[0] : today;
    get("priceDates").textContent = dates.length ? "Kayıtlı başlangıç tarihleri: " +
      dates.map(r => r.valid_from.split("-").reverse().join(".")).join(", ") : "";
    fill();
  }
  product.onchange = chooseProduct;
  day.onchange = fill;
  chooseProduct();
  const submit = form.querySelector("[type=submit]");
  const editSession = Symbol();
  form.editSession = editSession;
  submit.disabled = false;
  form.onsubmit = async event => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    get("editorStatus").textContent = "Kaydediliyor…";
    try {
      await saveAccountCost({product_key: product.value, valid_from: day.value,
        cost_cents: Math.round(cost.valueAsNumber * 100), vat_rate: Number(vat.value)}, owner);
      if (form.editSession === editSession) editor.close();
    } catch (error) { if (form.editSession === editSession) get("editorStatus").textContent = error.message; }
    finally { if (form.editSession === editSession) submit.disabled = false; }
  };
  editor.showModal();
}

get("cancelCost").addEventListener("click", () => get("costEditor").close());

function render() {
  const mode = get("group").value;
  if (!report || mode !== reportGroup) {
    report = monthlyReport(input.products.rows, input.finances.rows, mode,
      {products: input.products.date1904, finances: input.finances.date1904});
    reportGroup = mode;
  }
  const { totals, products } = report;
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
    const costCell = row.insertCell();
    costCell.append(cost);
    const vat = document.createElement("select");
    vat.setAttribute("aria-label", label + " KDV oranı");
    vat.add(new Option("Seçin", ""));
    for (const rate of [0, 1, 10, 20]) vat.add(new Option("%" + rate, String(rate)));
    vat.value = saved.vat;
    const vatCell = row.insertCell();
    vatCell.append(vat);
    const keys = [...new Set(p.costLines.map(line => line.productKey).filter(Boolean))];
    const useAccount = Boolean(accountId && keys.length && !showingSample);
    const recorded = useAccount && history ? historicalEarnings(p, history) : null;
    if (useAccount) {
      const rate = recorded?.rates.length === 1 ? recorded.rates[0] : null;
      const variable = recorded?.rates.length > 1 ? "Tarihe göre" : "—";
      costCell.textContent = rate ? price(rate.cost_cents) : variable;
      vatCell.textContent = rate ? "%" + rate.vat_rate : variable;
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "edit-cost";
      edit.textContent = keys.some(key => history?.has(key)) ? "Düzenle" : "Fiyat gir";
      edit.setAttribute("aria-label", label + " alış fiyatını düzenle");
      edit.disabled = !history;
      edit.addEventListener("click", () => editCost(p, keys, saved));
      costCell.append(edit);
    }
    const tax = row.insertCell();
    tax.hidden = !showTax;
    const profit = row.insertCell();
    const total = row.insertCell();
    function update() {
      const hasVat = vat.value !== "";
      const factor = 1 + Number(vat.value) / 100;
      const ready = hasVat && cost.value !== "" && cost.validity.valid;
      const earnings = useAccount ? recorded?.earnings :
        (ready ? productEarnings(p, Math.round(cost.valueAsNumber * 100), Number(vat.value)) : null);
      profit.textContent = earnings?.profitPerUnit == null ? "—" : price(earnings.profitPerUnit);
      total.textContent = earnings?.profit == null ? "—" : price(earnings.profit);
      if (p.incomplete) detail(total, "Ürüne dağıtılamayan sipariş var");
      else if (p.keptQty == null) detail(total, "İade adedi belirsiz");
      else if (useAccount && history && !recorded) detail(total, "Sipariş tarihinde geçerli fiyat veya ürün kodu eksik");
      else if (ready && earnings?.profit == null) detail(total, "Eksik veri");
      if (showTax) {
        const amount = useAccount ? recorded?.tax : (hasVat ? Math.round(p.taxGross / factor / 100) : null);
        tax.textContent = amount != null && p.taxQty ? price(amount) : "—";
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
  get("trySample").hidden = Boolean(input.products || input.finances);
  const loaded = Boolean(!showingSample && (input.products || input.finances));
  get("keepReport").hidden = !loaded;
  for (const [id, path] of [["reportLogin", "/giris"], ["reportSignup", "/kayit"]]) {
    const link = get(id);
    link.href = loaded ? path + "?rapor=acik" : path;
    link.target = loaded ? "_blank" : "_self";
    link.rel = "noopener";
  }
}

function reset() {
  showingSample = false;
  get("sampleNotice").hidden = true;
  report = null;
  costs.clear();
  input = {};
  get("results").hidden = true;
  get("items").replaceChildren();
  get("file").value = "";
  get("status").textContent = "";
  showSources();
}

if (location.protocol === "https:" || location.protocol === "http:") {
  get("reportGuest").hidden = false;
  import("./cost-account.js").then(async ({connectCostAccount}) => {
    saveAccountCost = await connectCostAccount(accountChanged);
  }).catch(() => {
    get("status").textContent = "Kayıtlı fiyatlar yüklenemedi. Raporu misafir olarak kullanabilir veya sayfayı yenileyebilirsiniz.";
  });
}

function accountChanged(owner, records) {
  if (owner !== accountId) {
    if (!showingSample) costs.clear();
    get("costEditor").close();
  }
  accountId = owner;
  history = records;
  if (input.products && input.finances) render();
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
      found[role] = { rows, date1904: book.Workbook?.WBProps?.date1904, name: file.name + " · " + name };
    }
  }
  if (!Object.keys(found).length) {
    throw Error(file.name + " içinde sipariş veya finans başlıkları bulunamadı. Sipariş listesinde Ürün Adı ve Satış Tutarı, finans listesinde Net Tutar ve Platform Hizmet Bedeli bulunmalı.");
  }
  return found;
}

get("clearFiles").addEventListener("click", reset);
get("trySample").addEventListener("click", () => {
  reset();
  input = sampleReport();
  showingSample = true;
  for (const [sku, name, cost] of [["RO-01", "Raf örtüsü", "75"], ["CS-01", "Çekmece düzenleyici", "90"]]) {
    const draft = {cost, vat: "20"};
    costs.set("name:" + name, draft);
    costs.set("sku:sku:" + sku, draft);
  }
  get("sampleNotice").hidden = false;
  showSources();
  render();
  get("sampleNotice").scrollIntoView({block: "center"});
});
get("group").addEventListener("change", () => { if (!get("results").hidden) render(); });
get("withholding").addEventListener("change", () => { if (!get("results").hidden) render(); });
get("file").addEventListener("change", async event => {
  const files = [...event.target.files];
  if (!files.length) return;
  if (input.products && input.finances) reset();
  get("file").disabled = true;
  get("trySample").disabled = true;
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
    report = null;
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
    get("trySample").disabled = false;
    get("clearFiles").disabled = false;
  }
});
