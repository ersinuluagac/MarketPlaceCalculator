import { getFormValues, consts } from "./data.js";
import * as calculator from "./calculator.js";
const cargoCompanies = consts.companies;

const values = getFormValues();

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
  console.log(
    normalCalculated.totalVat
  );
});
