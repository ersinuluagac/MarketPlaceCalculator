import { getFormValues, consts } from "./data.js";
const cargoCompanies = consts.companies;

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

// DOM Manipülasyonu
console.log(getFormValues(calculatorForm).shippingCompany)

