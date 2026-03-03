import { getFormValues, consts } from "./data.js";
import * as calculator from "./calculator.js";
const cargoCompanies = consts.companies;

const values = getFormValues();

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

// Ekrandaki ID'ler
const calculatorForm = document.querySelector("#calculatorForm");
const shippingCompanySelect = document.querySelector("#shippingCompany");

// Kargo firma seçeneklerini ekleme
document.addEventListener("DOMContentLoaded", () => {
  Object.entries(cargoCompanies).forEach(([key, cargoCompany]) => {
    const option = new Option(cargoCompany.name, key);
    shippingCompanySelect.appendChild(option);
  });
});

// Temizle butonu
document.querySelector("#clear").addEventListener("click", () => {
  calculatorForm.reset();
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

// Sonuçları Ekrana Yazdırma ve Animasyon Fonksiyonu
function displayResults(data) {
  // Sonuçların yazdırılacağı HTML elemanını seçiyoruz
  const resultDiv = document.querySelector("#result");

  // Animasyon için başlangıç durumu (Önce görünmez yapıyoruz)
  resultDiv.style.opacity = 0;
  resultDiv.style.transition = "opacity 0.4s ease-in-out";

  // Kâr durumuna göre renk ve ikon belirliyoruz (Yeşil veya Kırmızı)
  const profitColor = data.netProfit >= 0 ? "text-success" : "text-danger";
  const profitIcon =
    data.netProfit >= 0 ? "bi-graph-up-arrow" : "bi-graph-down-arrow";

  // profitRate (Kâr Oranı) değerinin hesaplanıp hesaplanmadığını kontrol ediyoruz
  const safeProfitRate = data.profitRate ? data.profitRate.toFixed(2) : "0.00";

  // HTML şablonunu oluşturup resultDiv'in içine ekliyoruz
  resultDiv.innerHTML = `
        <div class="card shadow border-0 mt-4 rounded-4">
            <div class="card-body p-4">
                <h4 class="card-title mb-4 text-center fw-bold text-secondary">Hesaplama Özeti</h4>

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
                            <button class="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCosts">
                                <i class="bi bi-receipt me-2 text-warning"></i> Maliyet Kalemleri
                            </button>
                        </h2>
                        <div id="collapseCosts" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion">
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
                            <button class="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapseVat">
                                <i class="bi bi-bank me-2 text-info"></i> KDV Detayları
                            </button>
                        </h2>
                        <div id="collapseVat" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion">
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

  // İçerik DOM'a eklendikten kısa bir süre sonra görünürlüğü %100 yapıyoruz (Fade-in efekti)
  setTimeout(() => {
    resultDiv.style.opacity = 1;
  }, 50);
}
