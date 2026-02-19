import { cargoData } from "./cargo.js";

const { companies: cargoCompanies, consts } = cargoData;

// Ekrandaki ID'ler
const calculatorForm = document.querySelector("#calculatorForm");
const resultArea = document.querySelector("#result");
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

// Form Data için Fonksiyonu
function getFormValues(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Form Verileri
  const salePriceWithVat = Number(data.salePrice);
  const commissionRate = Number(data.commission);
  const productCostExVat = Number(data.cost);
  const vatRate = Number(data.vatRate);
  const volumetricWeight = Number(data.volWeight);
  const selectedKey = data.shippingCompany;
  const cargoCompany = cargoCompanies[selectedKey];
  // KDV'siz değerler
  const salePriceExVat = salePriceWithVat / (1 + vatRate / 100);
  const commissionCostExVat = (salePriceWithVat * (commissionRate / 100)) / consts.taxMultiplier;
  const cargoCostExVat = (cargoCompany.prices[volumetricWeight]);
  const transactionCostExVat = consts.transactionFeeNormal;
  // KDV'li değerler
  const productCostWithVat = productCostExVat + (productCostExVat * vatRate / 100);
  const commissionCostWithVat = (salePriceWithVat * (commissionRate / 100));
  const cargoCostWithVat = cargoCostExVat * consts.taxMultiplier;
  const transactionCostWithVat = transactionCostExVat * consts.taxMultiplier;

  return {
    // Değerler
    commissionRate,
    vatRate,
    volumetricWeight,
    selectedKey,
    cargoCompany,
    // Fiyatlar
    salePriceWithVat,
    salePriceExVat,
    productCostWithVat,
    productCostExVat,
    commissionCostWithVat,
    commissionCostExVat,
    cargoCostExVat,
    cargoCostWithVat,
    transactionCostExVat,
    transactionCostWithVat
  };
}

// Hesapla butonu
document.querySelector("#calculate").addEventListener("click", (e) => {
  e.preventDefault();

  const allData = getFormValues(calculatorForm);

  // Hesaplama
  const netProfit = (
    allData.salePriceExVat -
    allData.commissionCostExVat -
    allData.productCostExVat -
    allData.cargoCostExVat -
    allData.transactionCostExVat
  ).toFixed(2);
  console.log(`Net Kâr: ${netProfit}`);


  // Vergiler
  const saleTax = salePrice - salePrice / (1 + vatRate / 100);
  const cargoTax = cargoPrice - cargoPrice / consts.taxMultiplier;
  const productTax = productPrice - productPrice / (1 + vatRate / 100);
  const commisionTax = commissionCost - commissionCost / consts.taxMultiplier;
  const transactionTax =
    transactionCost - transactionCost / consts.taxMultiplier;
  const totalTax =
    saleTax - (cargoTax + productTax + commisionTax + transactionTax);

  // Sonuçları ekrana basma
});
