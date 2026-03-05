import { getFormValues, consts } from "./data.js";
import * as calculator from "./calculator.js";
const cargoCompanies = consts.companies;

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
calculatorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = getFormValues(calculatorForm);

  // 2. Formdaki "required" alanlar doldurulmuş mu diye kontrol ediyoruz
  if (!calculatorForm.checkValidity()) {
    // Eğer doldurulmayan yer varsa:
    calculatorForm.classList.add("was-validated");
    calculatorForm.reportValidity();
    return; // Kodu burada durdurur!
  }

  // 3. Eğer her şey doğru doldurulduysa hata çerçevelerini temizler
  calculatorForm.classList.remove("was-validated");

  const normalCalculated = calculator.calculateNetProfit(
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
  newResultCard.innerHTML =`
    <div class="card shadow border-0 mt-3 rounded-5">
        <div class="card-body p-4">
            <!-- Üst Bölüm -->
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
            <!-- Üst Bölüm -->
            /////////////////////// devam edilecek
                <!-- Standart | Hızlı | Bugün -->
                <div class="row gx-3 gy-4 mb-4 text-center mt-3">
                  <div class="col-lg-4 position-relative">
                    <span
                      class="badge text-bg-secondary rounded-pill position-absolute top-0 start-50 translate-middle z-1 shadow-sm px-3">
                      Standart Teslimat
                    </span>
                    <div class="p-4 border border-2 rounded-4 bg-white shadow-sm h-100 d-flex flex-column">
                      <div class="mb-3 mt-2">
                        <span class="text-muted fw-medium d-block small mb-1 tracking-wider">NET KÂR / ZARAR</span>
                        <h3 class="mb-0 fw-bold text-success">
                          <i class="bi bi-graph-up-arrow me-1"></i>62.40 ₺
                        </h3>
                        <div class="mt-1">
                          <span class="badge bg-light text-dark border-0">Kâr Oranı: <span
                              class="text-success fw-bold">%20.8</span></span>
                        </div>
                      </div>
                      <div class="pt-3 border-top border-light-subtle mt-auto">
                        <div class="d-flex justify-content-between mb-1">
                          <span class="text-muted small">Hesaba Yatacak:</span>
                          <span class="fw-bold small text-primary">245.50 ₺</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span class="text-muted small">Ödenecek KDV:</span>
                          <span class="fw-bold small text-danger">12.20 ₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4 position-relative">
                    <span
                      class="badge text-bg-success rounded-pill position-absolute top-0 start-50 translate-middle z-1 shadow-sm px-3">
                      <i class="bi bi-lightning-charge-fill me-1"></i> Hızlı Teslimat
                    </span>
                    <div class="p-4 border border-2 rounded-4 bg-white shadow-sm h-100 d-flex flex-column">
                      <div class="mb-3 mt-2">
                        <span class="text-muted fw-medium d-block small mb-1">NET KÂR / ZARAR</span>
                        <h3 class="mb-0 fw-bold text-success">
                          <i class="bi bi-graph-up-arrow me-1"></i>42.40 ₺
                        </h3>
                        <div class="mt-1">
                          <span class="badge bg-light text-dark border-0">Kâr Oranı: <span
                              class="text-success fw-bold">%14.1</span></span>
                        </div>
                      </div>
                      <div class="pt-3 border-top border-light-subtle mt-auto">
                        <div class="d-flex justify-content-between mb-1">
                          <span class="text-muted small">Hesaba Yatacak:</span>
                          <span class="fw-bold small text-primary">225.50 ₺</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span class="text-muted small">Ödenecek KDV:</span>
                          <span class="fw-bold small text-danger">10.80 ₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-4 position-relative">
                    <span
                      class="badge text-bg-primary rounded-pill position-absolute top-0 start-50 translate-middle z-1 shadow-sm px-3">
                      <i class="bi bi-rocket-takeoff-fill me-1"></i> Bugün Teslimat
                    </span>
                    <div class="p-4 border border-2 rounded-4 bg-white shadow-sm h-100 d-flex flex-column">
                      <div class="mb-3 mt-2">
                        <span class="text-muted fw-medium d-block small mb-1">NET KÂR / ZARAR</span>
                        <h3 class="mb-0 fw-bold text-danger">
                          <i class="bi bi-graph-down-arrow me-1"></i>-12.60 ₺
                        </h3>
                        <div class="mt-1">
                          <span class="badge bg-light text-dark border-0">Kâr Oranı: <span
                              class="text-danger fw-bold">-%4.2</span></span>
                        </div>
                      </div>
                      <div class="pt-3 border-top border-light-subtle mt-auto">
                        <div class="d-flex justify-content-between mb-1">
                          <span class="text-muted small">Hesaba Yatacak:</span>
                          <span class="fw-bold small text-primary">195.50 ₺</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span class="text-muted small">Ödenecek KDV:</span>
                          <span class="fw-bold small text-danger">8.40 ₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Standart | Hızlı | Bugün -->
                <!-- Detaylar -->
                <div class="accordion accordion-flush border rounded-4 overflow-hidden shadow-sm mt-4"
                  id="detailsAccordion">
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed fw-bold bg-light" type="button"
                        data-bs-toggle="collapse" data-bs-target="#costs_example">
                        <i class="bi bi-receipt me-2 text-warning"></i> Maliyet Kalemleri
                      </button>
                    </h2>
                    <div id="costs_example" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion">
                      <div class="accordion-body p-0">
                        <ul class="list-group list-group-flush">
                          <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                            Komisyon Kesintisi:
                            <span class="fw-medium">45.00 ₺</span>
                          </li>
                          <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                            Ürün Maliyeti (KDV Dahil):
                            <span class="fw-medium">150.00 ₺</span>
                          </li>
                          <li class="list-group-item px-4 py-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <span>Kargo Ücreti <span class="text-muted small">(Standart)</span></span>
                              <span class="text-muted">35.50 ₺</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span class="text-success small fw-bold">
                                <i class="bi bi-arrow-return-right me-2"></i>Hızlı Teslimat
                              </span>
                              <span class="fw-bold text-success">32.50 ₺</span>
                            </div>
                          </li>
                          <li class="list-group-item px-4 py-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <span>İşlem Ücreti <span class="text-muted small">(Standart)</span></span>
                              <span class="text-muted">5.00 ₺</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span class="text-primary small fw-bold">
                                <i class="bi bi-arrow-return-right me-2"></i>Bugün Kargoda
                              </span>
                              <span class="fw-bold text-primary">2.50 ₺</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed fw-bold bg-light" type="button"
                        data-bs-toggle="collapse" data-bs-target="#vat_example">
                        <i class="bi bi-bank me-2 text-info"></i> KDV Detayları
                      </button>
                    </h2>
                    <div id="vat_example" class="accordion-collapse collapse" data-bs-parent="#detailsAccordion">
                      <div class="accordion-body p-0">
                        <ul class="list-group list-group-flush">
                          <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
                            Satıştan Doğan KDV
                            <span class="fw-medium text-success">+ 50.00 ₺</span>
                          </li>
                          <li
                            class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                            İndirilecek KDV (Komisyon)
                            <span>- 14.50 ₺</span>
                          </li>
                          <li
                            class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 text-muted">
                            İndirilecek KDV (Ürün)
                            <span>- 25.00 ₺</span>
                          </li>
                          <li class="list-group-item px-4 py-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <span>Kargo Ücreti <span class="text-muted small">(Standart)</span></span>
                              <span class="text-muted">35.50 ₺</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span class="text-success small fw-bold">
                                <i class="bi bi-arrow-return-right me-2"></i>Hızlı Teslimat
                              </span>
                              <span class="fw-bold text-success">32.50 ₺</span>
                            </div>
                          </li>
                          <li class="list-group-item px-4 py-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <span>Kargo Ücreti <span class="text-muted small">(Standart)</span></span>
                              <span class="text-muted">35.50 ₺</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <span class="text-primary small fw-bold">
                                <i class="bi bi-arrow-return-right me-2"></i>Bugün Kargoda
                              </span>
                              <span class="fw-bold text-primary">32.50 ₺</span>
                            </div>
                          </li>
                          <li
                            class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 bg-light fw-bold">
                            Ödenecek Net KDV
                            <span class="text-danger">10.50 ₺</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Detaylar -->
              </div>
            </div>`

  resultDiv.prepend(newResultCard);
}
