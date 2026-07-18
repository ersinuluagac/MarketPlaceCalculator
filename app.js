import { getFormValues, consts } from "./data.js";
import * as calculator from "./calculator.js";
const cargoCompanies = consts.companies;

// Tooltip Tanımlamaları
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

// DOM Elementleri
const calculatorForm = document.querySelector("#calculatorForm");
const resultDiv = document.querySelector("#result");
const shippingCompanySelect = document.querySelector("#shippingCompany");

// Başlangıç Yüklemeleri (Kargo firmaları ve Geçmiş Listesi)
document.addEventListener("DOMContentLoaded", () => {
  Object.entries(cargoCompanies).forEach(([key, cargoCompany]) => {
    const option = new Option(cargoCompany.name, key);
    shippingCompanySelect.appendChild(option);
  });
  renderHistory();
});

// Temizle Butonları
document.querySelector("#clearForm").addEventListener("click", () => {
  calculatorForm.reset();
});

// --- FORM GÖNDERME VE HESAPLAMA ---
calculatorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = getFormValues(calculatorForm);

  if (!calculatorForm.checkValidity()) {
    calculatorForm.classList.add("was-validated");
    calculatorForm.reportValidity();
    return;
  }
  calculatorForm.classList.remove("was-validated");

  if(resultDiv) resultDiv.innerHTML = ""; 

  const normalCalculated = calculator.calculateNetProfit(
    values.salePrice,
    values.commissionRate,
    values.productCost,
    values.productVatRate,
    values.shippingCompany,
    values.volumetricWeight,
    consts.taxAndTransaction
  );
  
  displayResults(normalCalculated);
  
  if (normalCalculated.netProfitNormal < 0) {
    const toastEl = document.getElementById('dangerToast');
    if(toastEl) {
      const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
      toast.show();
    }
  }

  // YENİ DÜZENLEME: Eğer form geçmişten yüklenmiyorsa (yani yepyeni bir işlemse) kaydet!
  if (calculatorForm.dataset.isRestoring !== "true") {
    values.shippingCompanyKey = shippingCompanySelect.value;
    saveCalculationToHistory(values, normalCalculated);
  }

  // İşlem bitince bayrağı (varsa) sıfırla
  calculatorForm.dataset.isRestoring = "false";
});


// --- GEÇMİŞ (LOCALSTORAGE) YÖNETİMİ ---
function saveCalculationToHistory(inputs, resultData) {
  const historyKey = "calculator_history";
  let history = JSON.parse(localStorage.getItem(historyKey)) || [];
  
  const newRecord = {
    id: Date.now(),
    date: new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
    inputs: inputs,
    profit: resultData.netProfitNormal,
    margin: resultData.profitMarginNormal
  };

  history.unshift(newRecord);
  if (history.length > 5) history.pop(); // Sadece son 10 kaydı tut

  localStorage.setItem(historyKey, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const historyKey = "calculator_history";
  const history = JSON.parse(localStorage.getItem(historyKey)) || [];
  const historyListDiv = document.getElementById("historyList");
  const historyCountSpan = document.getElementById("historyCount");
  
  if(historyCountSpan) historyCountSpan.textContent = history.length;

  if (!historyListDiv) return;

  if (history.length === 0) {
    historyListDiv.innerHTML = `<div class="text-center text-muted mt-5 pt-4"><p>Henüz kayıtlı hesaplamanız bulunmuyor.</p></div>`;
    return;
  }

  // HTML tarafına Kargo Firması adını (item.inputs.shippingCompany.name) ekledik
  historyListDiv.innerHTML = history.map(item => `
    <div class="card border border-light-subtle shadow-sm">
      <div class="card-body d-flex justify-content-between align-items-center p-3">
        <div>
          <span class="badge bg-light text-secondary border mb-2"><i class="bi bi-clock me-1"></i>${item.date}</span>
          <h6 class="mb-1 fw-bold">Satış: ${item.inputs.salePrice} ₺</h6>
          <small class="text-muted d-block mb-1"><i class="bi bi-truck me-1"></i>${item.inputs.shippingCompany.name}</small>
          <small class="text-muted">Net Kâr: <span class="${item.profit >= 0 ? 'text-success' : 'text-danger'} fw-bold">${item.profit} ₺</span> (%${item.margin})</small>
        </div>
        <button class="btn btn-sm btn-outline-primary fw-bold" onclick="restoreCalculation(${item.id})">
          <i class="bi bi-arrow-counterclockwise me-1"></i>Yükle
        </button>
      </div>
    </div>
  `).join("");
}

// Seçilen Geçmişi Forma Geri Doldurma (HTML içinden çağrılacağı için window objesine ekleniyor)
window.restoreCalculation = function(id) {
  const history = JSON.parse(localStorage.getItem("calculator_history")) || [];
  const record = history.find(item => item.id === id);
  
  if (record) {
    document.getElementById("salePrice").value = record.inputs.salePrice;
    document.getElementById("commissionRate").value = record.inputs.commissionRate;
    document.getElementById("productCost").value = record.inputs.productCost;
    document.getElementById("shippingCompany").value = record.inputs.shippingCompanyKey;
    document.getElementById("volumetricWeight").value = record.inputs.volumetricWeight;

    const vatSelect = document.getElementById("productVatRate");
    Array.from(vatSelect.options).forEach(opt => {
      if (Number(opt.value) === record.inputs.productVatRate) {
        vatSelect.value = opt.value;
      }
    });

    const currentTabEl = document.getElementById('current-tab');
    if(currentTabEl) {
      const currentTab = new bootstrap.Tab(currentTabEl);
      currentTab.show();
    }

    // YENİ DÜZENLEME: Sisteme bu işlemin bir "Geçmişi Yükleme" işlemi olduğunu söylüyoruz
    document.getElementById("calculatorForm").dataset.isRestoring = "true";
    
    // Ve şimdi güvenle tıklatabiliriz
    document.getElementById("calculate").click();
  }
};


// --- UI (ARAYÜZ) OLUŞTURUCU FONKSİYONLAR ---
function createProfitCard(title, badgeColor, icon, colClass, profit, margin, roi, deposit, vat) {
  const isProfit = profit >= 0;
  const statusColor = isProfit ? badgeColor : "danger";
  const statusIcon = isProfit ? "bi-graph-up-arrow" : "bi-graph-down-arrow";
  const iconHtml = icon ? `<i class="bi ${icon} me-1"></i>` : "";

  return `
    <div class="${colClass} position-relative">
      <span class="badge text-bg-${badgeColor} rounded-pill position-absolute top-0 start-50 translate-middle z-1 shadow-sm px-3">
        ${iconHtml} ${title}
      </span>
      <div class="p-4 border border-${badgeColor}-subtle border-2 rounded-4 bg-white shadow-sm h-100 d-flex flex-column">
        <div class="mb-3 mt-2">
          <span class="text-muted fw-medium d-block small mb-1 tracking-wider">NET KÂR / ZARAR</span>
          <h3 class="mb-0 fw-bold text-${statusColor}">
            <i class="bi ${statusIcon} me-1"></i> ₺${profit}
          </h3>
          <div class="mt-1">
            <span class="badge bg-light text-dark border-0">
              Kâr Marjı: <span class="text-${statusColor} fw-bold">%${margin}</span>
            </span>
          </div>
          <div class="mt-1">
            <span class="badge bg-light text-dark border-0">
              Yatırım Getirisi: <span class="text-${statusColor} fw-bold">%${roi}</span>
            </span>
          </div>
        </div>
        <div class="pt-3 border-top border-light-subtle mt-auto">
          <div class="d-flex justify-content-between mb-1">
            <span class="text-muted small">Hesaba Yatacak:</span>
            <span class="fw-bold small text-${badgeColor}">₺${deposit}</span>
          </div>
          <div class="d-flex justify-content-between">
            <span class="text-muted small">Ödenecek KDV:</span>
            <span class="fw-bold small text-danger">₺${vat}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createAccordionDetails(data, uniqueId, hasFastShipping) {
  return `
    <div class="accordion accordion-flush border rounded-4 overflow-hidden shadow-sm mt-4" id="detailsAccordion_${uniqueId}">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#costs_${uniqueId}">
            <i class="bi bi-receipt me-2 text-warning"></i> Maliyet Kalemleri <span class="text-muted small ms-1">(KDV Dahil)</span>
          </button>
        </h2>
        <div id="costs_${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion_${uniqueId}">
          <div class="accordion-body p-0">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between px-4 py-3">Komisyon Kesintisi: <span class="fw-medium">₺${data.fullCommissionCost}</span></li>
              <li class="list-group-item d-flex justify-content-between px-4 py-3">Ürün Maliyeti (KDV Dahil): <span class="fw-medium">₺${data.fullProductCost}</span></li>
              <li class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>Kargo Ücreti <span class="text-muted small">${hasFastShipping ? "(Standart)" : ""}</span></span>
                  <span class="text-muted">₺${data.fullNormalShippingCost}</span>
                </div>
                ${hasFastShipping ? `<div class="d-flex justify-content-between"><span class="text-success small fw-bold"><i class="bi bi-arrow-return-right me-2"></i>Hızlı Teslimat</span><span class="fw-bold text-success">₺${data.fullFastShippingCost}</span></div>` : ""}
              </li>
              <li class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>İşlem Ücreti <span class="text-muted small">(Standart)</span></span>
                  <span class="text-muted">₺${data.fullNormalTransactionCost}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-primary small fw-bold"><i class="bi bi-arrow-return-right me-2"></i>Bugün Kargoda</span>
                  <span class="fw-bold text-primary">₺${data.fullFastTransactionCost}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#vat_${uniqueId}">
            <i class="bi bi-bank me-2 text-info"></i> KDV Detayları
          </button>
        </h2>
        <div id="vat_${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion_${uniqueId}">
          <div class="accordion-body p-0">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between px-4 py-3">Satıştan Doğan KDV <span class="fw-medium text-success">+ ₺${data.vatSale}</span></li>
              <li class="list-group-item d-flex justify-content-between px-4 py-3">Komisyon KDV <span class="fw-medium text-danger">- ₺${data.vatCommission}</span></li>
              <li class="list-group-item d-flex justify-content-between px-4 py-3">Ürün KDV <span class="fw-medium text-danger">- ₺${data.vatProduct}</span></li>
              <li class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>Kargo KDV <span class="text-muted small">${hasFastShipping ? "(Standart)" : ""}</span></span>
                  <span class="fw-medium text-danger">- ₺${data.vatNormalShipping}</span>
                </div>
                ${hasFastShipping ? `<div class="d-flex justify-content-between"><span class="text-success small fw-bold"><i class="bi bi-arrow-return-right me-2"></i>Hızlı Teslimat</span><span class="fw-bold text-success">- ₺${data.vatFastShipping}</span></div>` : ""}
              </li>
              <li class="list-group-item px-4 py-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>İşlem Ücreti KDV <span class="text-muted small">(Standart)</span></span>
                  <span class="fw-medium text-danger">- ₺${data.vatNormalTransaction}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-primary small fw-bold"><i class="bi bi-arrow-return-right me-2"></i>Bugün Kargoda</span>
                  <span class="fw-bold text-primary">- ₺${data.vatFastTransaction}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Ana Render Fonksiyonu
function displayResults(data) {
  const uniqueId = Date.now();
  const currentTime = new Date().toLocaleTimeString("tr-TR");
  const hasFastShipping = data.shippingType === "Üst Barem" || data.shippingType === "Alt Barem";
  const colClass = hasFastShipping ? "col-lg-4" : "col-lg-6";

  const newResultCard = document.createElement("div");

  const standardCard = createProfitCard("Standart Teslimat", "secondary", null, colClass, data.netProfitNormal, data.profitMarginNormal, data.roiNormal, data.amountToDepositedNormal, data.totalVatNormal);
  const fastCard = hasFastShipping ? createProfitCard("Hızlı Teslimat", "success", "bi-lightning-charge-fill", colClass, data.netProfitFast, data.profitMarginFast, data.roiFast, data.amountToDepositedFast, data.totalVatFast) : "";
  const todayCard = createProfitCard("Bugün Kargoda", "primary", "bi-rocket-takeoff-fill", colClass, data.netProfitToday, data.profitMarginToday, data.roiToday, data.amountToDepositedToday, data.totalVatToday);

  newResultCard.innerHTML = `
    <div class="card shadow border-0 rounded-5">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-lg-row justify-content-lg-between align-items-center mb-4 gap-3 text-center text-lg-start">
          <h5 class="card-title mb-0 fw-bold text-secondary">
            Hesaplama Özeti
            <small class="text-muted fw-normal ms-lg-2 fs-6 d-block d-lg-inline mt-2 mt-lg-0">
              <i class="bi bi-clock me-1"></i>${currentTime}
            </small>
          </h5>
          <span class="badge bg-light text-secondary border p-2 fs-8 fw-medium text-wrap">
            Satış: ${data.salePrice} ₺ <span class="text-black-50 mx-1">|</span> 
            Komisyon: %${data.commissionRate} <span class="text-black-50 mx-1">|</span> 
            İşlem: ${uniqueId.toString().slice(-4)}
          </span>
        </div>
        <div class="row gx-3 gy-4 mb-4 text-center mt-3">
          ${standardCard}
          ${fastCard}
          ${todayCard}
        </div>
        ${createAccordionDetails(data, uniqueId, hasFastShipping)}
      </div>
    </div>
  `;

  if(resultDiv) resultDiv.prepend(newResultCard);
}

// --- GECE/GÜNDÜZ MODU (DARK MODE) YÖNETİMİ ---
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const htmlElement = document.documentElement;

// Sayfa yüklendiğinde hafızadaki temayı uygula
const savedTheme = localStorage.getItem("calculator_theme") || "light";
applyTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
}

function applyTheme(theme) {
  // Bootstrap 5'in ana tema etiketini HTML'e ekle
  htmlElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("calculator_theme", theme);
  
  // İkonu ve buton rengini değiştir
  if (theme === "dark") {
    themeIcon.className = "bi bi-sun-fill text-warning"; // Sarı güneş ikonu
    themeToggleBtn.classList.replace("btn-outline-secondary", "btn-outline-light");
  } else {
    themeIcon.className = "bi bi-moon-fill"; // Koyu ay ikonu
    themeToggleBtn.classList.replace("btn-outline-light", "btn-outline-secondary");
  }
}