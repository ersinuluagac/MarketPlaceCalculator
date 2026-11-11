import { consts, getFormValues } from "./data.js";
import { calculateNetProfit } from "./calculator.js";

const form = document.querySelector("#calculatorForm");
const report = document.querySelector("#report");
const scenario = document.querySelector("#scenario");
const result = document.querySelector("#result");
const theme = document.querySelector("#theme");
const historyKey = "calculator_history";
const moneyFormat = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const numberFormat = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const money = value => moneyFormat.format(Number(value));
const percent = value => Number.isFinite(Number(value)) ? "%" + numberFormat.format(value) : "—";
let current;
let history;

function readSetting(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function saveSetting(key, value) {
  try { localStorage.setItem(key, value); } catch { /* The session still works without storage. */ }
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  theme.setAttribute("aria-pressed", String(mode === "dark"));
}
applyTheme(readSetting("calculator_theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
theme.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  saveSetting("calculator_theme", next);
});

for (const [key, company] of Object.entries(consts.companies)) {
  form.elements.shippingCompany.add(new Option(company.name, key));
}

function updateResult() {
  const { inputs, data } = current;
  const mode = scenario.value;
  const fastCargo = mode !== "Normal";
  const today = mode === "Today";
  const profit = data["netProfit" + mode];
  document.querySelector("#resultTitle").textContent = Number(profit) < 0 ? "Tahmini net zarar" : "Tahmini net kâr";
  const amount = document.querySelector("#profit");
  amount.textContent = money(profit);
  amount.classList.toggle("loss", Number(profit) < 0);
  const tariff = { Normal: "Desi tarifesi", "Alt Barem": "0–199,99 TL baremi", "Üst Barem": "200–349,99 TL baremi" };
  document.querySelector("#context").textContent = [inputs.shippingCompany.name, inputs.volumetricWeight + " desi", tariff[data.shippingType]].join(" · ");
  document.querySelector("#tariffDate").textContent = data.shippingType === "Normal"
    ? "Desi tarifesi · 5 Ekim 2026’dan itibaren"
    : "Barem tarifesi · 10 Ağustos 2026’dan itibaren";
  document.querySelector("#margin").textContent = percent(data["profitMargin" + mode]);
  document.querySelector("#roi").textContent = percent(data["roi" + mode]);
  document.querySelector("#deposit").textContent = money(data["amountToDeposited" + mode]);

  const costs = [
    ["Satış fiyatı (KDV dahil)", data.salePrice],
    ["Ürün maliyeti (KDV dahil)", data.fullProductCost],
    ["Komisyon (KDV dahil)", data.fullCommissionCost],
    ["Kargo (KDV dahil)", fastCargo ? data.fullFastShippingCost : data.fullNormalShippingCost],
    ["İşlem ücreti (KDV dahil)", today ? data.fullFastTransactionCost : data.fullNormalTransactionCost],
    ["Satış KDV’si", data.vatSale],
    ["Ürün maliyeti KDV’si", data.vatProduct],
    ["Komisyon KDV’si", data.vatCommission],
    ["Kargo KDV’si", fastCargo ? data.vatFastShipping : data.vatNormalShipping],
    ["İşlem ücreti KDV’si", today ? data.vatFastTransaction : data.vatNormalTransaction],
    ["Net KDV", data["totalVat" + mode]]
  ];
  const breakdown = document.querySelector("#breakdown");
  breakdown.replaceChildren();
  for (const [title, value] of costs) {
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const cost = document.createElement("dd");
    label.textContent = title;
    cost.textContent = money(value);
    row.append(label, cost);
    breakdown.append(row);
  }
}

function calculate(save) {
  const inputs = getFormValues(form);
  const data = calculateNetProfit(inputs.salePrice, inputs.commissionRate, inputs.productCost,
    inputs.productVatRate, inputs.shippingCompany, inputs.volumetricWeight, consts.taxAndTransaction);
  current = { inputs, data };
  scenario.replaceChildren(new Option("Standart teslimat", "Normal"));
  if (data.shippingType !== "Normal") scenario.add(new Option("Hızlı teslimat", "Fast"));
  scenario.add(new Option("Bugün kargoda", "Today"));
  updateResult();
  report.hidden = false;
  if (save) {
    const savedInputs = Object.fromEntries(new FormData(form));
    savedInputs.shippingCompanyKey = form.elements.shippingCompany.value;
    history.unshift({ id: Date.now(), inputs: savedInputs, profit: data.netProfitNormal });
    history = history.slice(0, 5);
    saveSetting(historyKey, JSON.stringify(history));
    renderHistory();
  }
  result.focus({ preventScroll: true });
  if (matchMedia("(max-width: 760px)").matches) result.scrollIntoView({ block: "start" });
}
form.addEventListener("submit", event => {
  event.preventDefault();
  calculate(true);
});
scenario.addEventListener("change", updateResult);

function clearResult() {
  current = null;
  report.hidden = true;
  document.querySelector("#resultTitle").textContent = "Tahmini net kâr";
  document.querySelector("#profit").textContent = "—";
  document.querySelector("#profit").classList.remove("loss");
  document.querySelector("#context").textContent = "Ürün ve kargo bilgilerini girip hesaplayın.";
}
form.addEventListener("reset", clearResult);
form.addEventListener("input", () => { if (current) clearResult(); });

function renderHistory() {
  const list = document.querySelector("#history");
  document.querySelector("#count").textContent = "(" + history.length + ")";
  list.replaceChildren();
  if (!history.length) {
    const empty = document.createElement("p");
    empty.textContent = "Henüz kayıtlı hesaplama yok.";
    list.append(empty);
  }
  for (const record of history) {
    const { inputs } = record;
    const row = document.createElement("div");
    row.className = "history-item";
    const text = document.createElement("div");
    text.textContent = money(inputs.salePrice) + " satış";
    const info = document.createElement("small");
    info.textContent = consts.companies[inputs.shippingCompanyKey].name + " · Net kâr " + money(record.profit);
    text.append(info);
    const restore = document.createElement("button");
    restore.type = "button";
    restore.textContent = "Yükle";
    restore.addEventListener("click", () => {
      for (const name of ["salePrice", "productCost", "commissionRate", "volumetricWeight"]) form.elements[name].value = inputs[name];
      for (const option of form.elements.productVatRate.options) {
        if (option.value && Number(option.value) === Number(inputs.productVatRate)) form.elements.productVatRate.value = option.value;
      }
      form.elements.shippingCompany.value = inputs.shippingCompanyKey;
      if (form.reportValidity()) calculate(false);
      else clearResult();
    });
    row.append(text, restore);
    list.append(row);
  }
}
try {
  const saved = JSON.parse(readSetting(historyKey));
  history = Array.isArray(saved) ? saved.filter(row => Object.hasOwn(consts.companies, row?.inputs?.shippingCompanyKey)).slice(0, 5) : [];
} catch { history = []; }
renderHistory();
