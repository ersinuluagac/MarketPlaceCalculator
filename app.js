import { cargoData } from "./cargo.js";

const { companies: cargoCompanies, consts } = cargoData;

// Ekrandaki ID'ler
const calculatorForm = document.querySelector("#calculatorForm");
const resultArea = document.querySelector("#result");
const shippingCompanySelect = document.querySelector("#shippingCompany");

// Kargo firma seçeneklerini ekleme
document.addEventListener("DOMContentLoaded", () => {
  const selectElement = shippingCompanySelect;
  Object.entries(cargoCompanies).forEach(([key, cargoCompany]) => {
    const option = new Option(cargoCompany.name, key);
    shippingCompanySelect.appendChild(option);
  });
});

// Temizle butonu
document.querySelector("#clear").addEventListener("click", () => {
  calculatorForm.reset();
});

// Hesapla butonu
document.querySelector("#calculate").addEventListener("click", () => {
  // Değerleri alma
  const formData = new FormData(calculatorForm);
  const data = Object.fromEntries(formData.entries());

  const salePrice = Number(data.salePrice);
  const commissionRate = Number(data.commission);
  const productCost = Number(data.cost);
  const vatRate = Number(data.vatRate);
  const volumetricWeight = Number(data.volWeight);
  const selectedKey = data.shippingCompany;
  const cargoCompany = cargoCompanies[selectedKey];

  const salePriceExVat = salePrice / (1 + vatRate / 100);
  const commissionCostExVat = (salePrice * (commissionRate / 100)) / consts.taxMultiplier;

  // Hesaplama
  console.log(`Net Kâr: ${(salePriceExVat - commissionCostExVat - productCost - cargoCompany.prices[volumetricWeight] - consts.transactionFeeNormal).toFixed(2)}`);


  // Refactor edilecek
  const productPrice = productCost + productCost * (vatRate / 100);
  const commissionCost = salePrice * (commissionRate / 100);
  const cargoPrice =
    cargoCompany.prices[volumetricWeight] * consts.taxMultiplier;
  const transactionCost = consts.transactionFeeNormal * consts.taxMultiplier;

  // Vergiler
  const saleTax = salePrice - salePrice / (1 + vatRate / 100);
  const cargoTax = cargoPrice - cargoPrice / consts.taxMultiplier;
  const productTax = productPrice - productPrice / (1 + vatRate / 100);
  const commisionTax = commissionCost - commissionCost / consts.taxMultiplier;
  const transactionTax =
    transactionCost - transactionCost / consts.taxMultiplier;
  const totalTax =
    saleTax - (cargoTax + productTax + commisionTax + transactionTax);

  const result =
    salePrice -
    totalTax -
    productPrice -
    cargoPrice -
    commissionCost -
    transactionCost;

  // Hesaplama

  // Sonuçları ekrana basma
});
