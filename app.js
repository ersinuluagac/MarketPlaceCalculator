import { getFormValues, consts } from "./data.js";
import * as calculator from "./calculator.js";
const cargoCompanies = consts.companies;

const values = getFormValues();

const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
);

// Ekrandaki ID'ler
const calculatorForm = document.querySelector("#calculatorForm");
const resultDiv = document.querySelector("#result");
const shippingCompanySelect = document.querySelector("#shippingCompany");

// Kargo firma seçeneklerini ekleme
document.addEventListener("DOMContentLoaded", () => {
  Object.entries(cargoCompanies).forEach(([key, cargoCompany]) => {
    const option = new Option(cargoCompany.name, key);
    shippingCompanySelect.appendChild(option);
  });
});

// Temizle butonları
document.querySelector("#clearForm").addEventListener("click", () => {
  calculatorForm.reset();
});
document.querySelector("#clearResult").addEventListener("click", () => {
  resultDiv.innerHTML = "";
});

// DOM İşlemleri
document.querySelector("#calculate").addEventListener("click", (e) => {
  e.preventDefault();
  const values = getFormValues(calculatorForm);

  const normalCalculated = calculator.calculateNormalTierNetProfit(
    values.salePrice,
    values.commissionRate,
    values.productCost,
    values.productVatRate,
    values.shippingCompany,
    values.volumetricWeight,
    consts.taxAndTransaction,
  );
  displayResults(normalCalculated);
});

// Sonuçları Ekrana Yazdırma
function displayResults(data) {
  const uniqueId = Date.now();
  const currentTime = new Date().toLocaleTimeString("tr-TR");

  // Kâr durumuna göre renk ve ikon (Yeşil veya Kırmızı)
  const profitColor = data.netProfit >= 0 ? "text-success" : "text-danger";
  const profitIcon =
    data.netProfit >= 0 ? "bi-graph-up-arrow" : "bi-graph-down-arrow";

  // profitRate (Kâr Oranı) değerinin hesaplanmasını kontrol
  const safeProfitRate = isFinite(data.profitRate)
    ? data.profitRate.toFixed(2)
    : "0.00";

  // Yeni hesaplama için yepyeni bir "div" (kapsayıcı) oluşturuyoruz
  const newResultCard = document.createElement("div");

  // HTML şablonunu oluşturup resultDiv'in içine ekliyoruz
  newResultCard.innerHTML = `
        <div class="card shadow border-0 mt-4 rounded-4">
            <div class="card-body p-4">
                <div class="d-flex flex-column flex-md-row justify-content-md-between align-items-start align-items-md-center mb-4 gap-2">
                    
                    <h5 class="card-title mb-0 fw-bold text-secondary">
                        Hesaplama Özeti 
                        <small class="text-muted fw-normal ms-2 fs-6">
                            <i class="bi bi-clock me-1"></i>${currentTime}
                        </small>
                    </h5>

                    <span class="badge bg-light text-secondary border p-2">
                        Satış: ${data.vatSale ? (data.vatSale + data.vatSale / 0.2).toFixed(2) : "..."} ₺ | İşlem: #${uniqueId.toString().slice(-4)}
                    </span>

                </div>

                <div class="row g-3 mb-4 text-center">
                    
                    <div class="col-md-4">
                        <div class="p-3 border rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center">
                            <span class="text-muted d-block mb-2">Net Kâr / Zarar</span>
                            <h3 class="mb-0 fw-bold ${profitColor}">
                                <i class="bi ${profitIcon} me-2"></i>${data.netProfit.toFixed(2)} ₺
                            </h3>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="p-3 border rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center">
                            <span class="text-muted d-block mb-2">Kâr Oranı</span>
                            <h3 class="mb-0 fw-bold ${profitColor}">
                                %${safeProfitRate}
                            </h3>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="p-3 border rounded-4 bg-light shadow-sm h-100 d-flex flex-column justify-content-center">
                            <span class="text-muted d-block mb-2">Hesaba Yatan Tutar</span>
                            <h3 class="mb-0 fw-bold text-primary">
                                <i class="bi bi-wallet2 me-2"></i>${data.amountToDeposited.toFixed(2)} ₺
                            </h3>
                            <small class="text-muted mt-2 fw-medium">
                                Ödenecek KDV: <span class="text-danger">${data.totalVat.toFixed(2)} ₺</span>
                            </small>
                        </div>
                    </div>

                </div>

                <div class="accordion accordion-flush border rounded-4 overflow-hidden shadow-sm" id="detailsAccordion">
                    
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#costs_${uniqueId}">
                                <i class="bi bi-receipt me-2 text-warning"></i> Maliyet Kalemleri
                            </button>
                        </h2>
                        <div id="costs_${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#accordion_${uniqueId}">
                            <div class="accordion-body p-0">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                        Komisyon Kesintisi
                                        <span class="fw-medium">${data.fullCommissionCost.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                        Ürün Maliyeti (KDV Dahil)
                                        <span class="fw-medium">${data.fullProductCost.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                        Kargo Ücreti
                                        <span class="fw-medium">${data.fullShippingCost.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                        İşlem Ücreti
                                        <span class="fw-medium">${data.fullTransactionCost.toFixed(2)} ₺</span>
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
                        <div id="vat_${uniqueId}" class="accordion-collapse collapse" data-bs-parent="#accordion_${uniqueId}">
                            <div class="accordion-body p-0">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                                        Satıştan Doğan KDV
                                        <span class="fw-medium text-success">+ ${data.vatSale.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                                        İndirilecek KDV (Komisyon)
                                        <span>- ${data.vatCommission.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                                        İndirilecek KDV (Ürün)
                                        <span>- ${data.vatProduct.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                                        İndirilecek KDV (Kargo)
                                        <span>- ${data.vatShipping.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                                        İndirilecek KDV (İşlem Ücreti)
                                        <span>- ${data.vatTransaction.toFixed(2)} ₺</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 bg-light fw-bold">
                                        Ödenecek Net KDV
                                        <span class="text-danger">${data.totalVat.toFixed(2)} ₺</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
  // Oluşturduğumuz HTML yapısını ana div'in en altına ekliyoruz
  resultDiv.prepend(newResultCard);
}
