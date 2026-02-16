import { cargoData } from "./cargo.js";

const cargoCompanies = cargoData.companies;

// Ekrandaki ID'ler
let calculatorForm = document.querySelector("#calculatorForm")
let salePrice = document.querySelector("#salePrice");
let commission = document.querySelector("#commission");
let cost = document.querySelector("#cost");
let vatRate = document.querySelector("#vatRate");
let shippingCompany = document.querySelector("#shippingCompany");
let desi = document.querySelector("#desi");
let clear = document.querySelector("#clear");
let calculate = document.querySelector("#calculate");

// Kargo firma seçeneği ekleme
document.addEventListener("DOMContentLoaded", () => {
  const selectElement = shippingCompany;
  Object.keys(cargoCompanies).forEach((key) => {
    const company = cargoCompanies[key];
    const option = document.createElement("option");
    option.value = key;
    option.textContent = company.name;
    selectElement.appendChild(option);
  });
});

// Temizle butonu
clear.addEventListener("click", () => {
  calculatorForm.reset();
});

// Submit butonu
calculate.addEventListener("click", () => {
  let entrySalePrice = salePrice.value;
  let entryCommision = commission.value;
  let selectedCargo = shippingCompany.value;
  let selectedDesi = desi.value;
  let productCost = cost.value;
  let entryVatRate = vatRate.value;
  console.log(`Satış Fiyatı: ${entrySalePrice} | Trendyol Komisyonu: ${entryCommision} | Seçilan Kargo Şirket: ${cargoCompanies[selectedCargo].name} | Kargo Desisi: ${selectedDesi} | Ürün Maaliyeti: ${productCost} | Ürün KDV'si: ${entryVatRate}`)
});

