/*
  Yuvarlama işlemleri için: toFixed(2)
*/

import { cargoData } from "./cargo.js";

const cargoCompanies = cargoData.companies;
const { consts } = cargoData;

// Ekrandaki ID'ler
const calculatorForm = document.querySelector("#calculatorForm");
const resultArea = document.querySelector("#result");
const shippingCompanySelect = document.querySelector("#shippingCompany");
const calculateBtn = document.querySelector("#calculate");

// Kargo firma seçeneği ekleme
document.addEventListener("DOMContentLoaded", () => {
  const selectElement = shippingCompanySelect;
  Object.entries(cargoCompanies).forEach(([key, company]) => {
    const option = new Option(company.name, key);
    shippingCompanySelect.appendChild(option);
  });
});

// Temizle butonu
document.querySelector("#clear").addEventListener("click", () => {
  calculatorForm.reset();
  resultArea.innerHTML = "";
});

// Submit butonu
calculateBtn.addEventListener("click", (e) => {
  e.preventDefault();
  // Değerleri alma
  const formData = new FormData(calculatorForm);
  const data = Object.fromEntries(formData.entries());

  // Dönüşümler
  const sPrice = parseFloat(data.salePrice);
  const commRate = parseFloat(data.commission);
  const pCost = parseFloat(data.cost);
  const vRate = parseFloat(data.vatRate);
  const productPrice = pCost + pCost * (vRate / 100);
  const dValue = parseInt(data.desi);
  const selectedKey = data.shippingCompany;
  const company = cargoCompanies[selectedKey];

  const commCost = sPrice * (commRate / 100);
  const cargoPrice = company.prices[dValue] * consts.taxMultiplier;
  const transactionCost = consts.transactionFeeNormal * consts.taxMultiplier;

  console.log(
    `Satış Fiyatı: ${sPrice} | Trendyol Komisyonu: ${commRate} | Seçilan Kargo Şirket: ${company.name} | Kargo Desisi: ${dValue} | Ürün Maaliyeti: ${pCost} | Ürün KDV'si: ${vRate}`,
  );

  // Vergiler
  const saleTax = sPrice - sPrice / (1 + vRate / 100);
  const cargoTax = cargoPrice - cargoPrice / consts.taxMultiplier;
  const productTax = productPrice - productPrice / (1 + vRate / 100);
  const commisionTax = commCost - commCost / consts.taxMultiplier;
  const transactionTax = transactionCost - transactionCost / consts.taxMultiplier;
  console.log(`Vergi: ${saleTax - cargoTax - productTax - commisionTax - transactionTax}`)

  // Hesaplama

  // Sonuçları ekrana basma
});
