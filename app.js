import { cargoData } from "./cargo.js";

const cargoCompanies = cargoData.companies;

// Ekrandaki ID'ler
let salePrice = document.querySelector("#salePrice");
let commission = document.querySelector("#commission");
let cost = document.querySelector("#cost");
let vatRate = document.querySelector("#vatRate");
let shippingCompany = document.querySelector("#shippingCompany");
let desi = document.querySelector("#desi");

document.addEventListener("DOMContentLoaded", () => {
  const selectElement = document.getElementById("shippingCompany");
  Object.keys(cargoCompanies).forEach((key) => {
    const company = cargoCompanies[key];
    const option = document.createElement("option");
    option.value = key;
    option.textContent = company.name;
    selectElement.appendChild(option);
  });
});

shippingCompany.addEventListener("change", () => {
  const selectedKey = shippingCompany.value;
  const selectedCompany = cargoCompanies[selectedKey];

  console.log(`Kargo anahtarı: ${selectedKey}, Şirket adı: ${selectedCompany.name}`)
})
