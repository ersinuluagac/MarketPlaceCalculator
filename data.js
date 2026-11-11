export function getFormValues(form) {
  // JSON formatına uygun şablon oluştur
  const formData = new FormData(form);
  const allForm = Object.fromEntries(formData.entries());

  // Form Verileri
  const salePrice = Number(allForm.salePrice);
  const commissionRate = Number(allForm.commissionRate);
  const productCost = Number(allForm.productCost);
  const productVatRate = Number(allForm.productVatRate);
  const selectedCargoKey = allForm.shippingCompany;
  const shippingCompany = consts.companies[selectedCargoKey];
  const volumetricWeight = Number(allForm.volumetricWeight);

  return {
    salePrice, commissionRate, productCost, productVatRate, shippingCompany, volumetricWeight
  }
}

// Sabitler
export const consts = {
  // Vergi ve İşlem
  taxAndTransaction: {
    taxMultiplier: 1.20,
    transactionFeeTierFast: 4.99,
    transactionFeeTierNormal: 10.99,
  },
  // Firmalar ve Fiyatlar
  /*
    Not: Desi bilgisi ve index eşittir.
  */
  companies: {
    tex: {
      name: "Trendyol Express",
      shippingTierFast: [38.74, 70.41],
      shippingTierNormal: [73.33, 78.74],
      prices: [
        81.95, // 0 Desi
        81.95, 81.95, 100.20, 107.20, 114.10, 125.60, 133.41, 142.32, 150.64, 164.18, // 1-10 Desi
        173.42, 182.20, 190.46, 198.10, 206.03, 213.82, 224.32, 233.82, 243.28, 252.77, // 11-20 Desi
        263.34, 272.61, 283.24, 293.35, 303.36, 315.98, 327.76, 338.64, 350.65, 360.55 // 21-30 Desi
      ]
    },
    aras: {
      name: "Aras Kargo",
      shippingTierFast: [48.33, 79.16],
      shippingTierNormal: [80.83, 86.24],
      prices: [
        88.96, // 0 Desi
        88.96, 88.96, 100.84, 109.90, 117.85, 128.39, 136.17, 145.27, 153.60, 164.23, // 1-10 Desi
        173.09, 179.47, 187.61, 194.84, 202.03, 213.36, 224.62, 235.95, 247.24, 252.09, // 11-20 Desi
        264.80, 276.40, 287.97, 298.26, 308.50, 322.85, 335.94, 347.66, 361.09, 371.34 // 21-30 Desi
      ]
    },
    ptt: {
      name: "PTT",
      shippingTierFast: [38.74, 70.41],
      shippingTierNormal: [73.33, 78.74],
      prices: [
        81.95, // 0 Desi
        81.95, 81.95, 100.00, 105.60, 110.61, 120.83, 129.17, 138.30, 150.00, 169.84, // 1-10 Desi
        178.21, 187.17, 196.16, 205.14, 214.08, 223.04, 232.02, 240.98, 249.97, 258.94, // 11-20 Desi
        267.90, 276.87, 285.83, 294.79, 303.77, 312.75, 321.71, 330.67, 339.64, 348.60 // 21-30 Desi
      ]
    },
    surat: {
      name: "Sürat Kargo",
      shippingTierFast: [54.58, 85.41],
      shippingTierNormal: [87.08, 92.49],
      prices: [
        95.54, // 0 Desi
        95.54, 95.54, 106.45, 116.40, 122.41, 134.48, 143.61, 152.60, 161.73, 170.86, // 1-10 Desi
        182.99, 193.34, 201.11, 206.02, 213.51, 220.73, 232.45, 244.17, 255.75, 267.46, // 11-20 Desi
        279.46, 290.36, 300.98, 311.75, 322.37, 332.73, 343.09, 353.45, 363.79, 374.15 // 21- 30 Desi
      ]
    },
    dhl: {
      name: "DHL eCommerce",
      shippingTierFast: [57.08, 87.91],
      shippingTierNormal: [89.58, 94.99],
      prices: [
        97.99, // 0 Desi
        97.99, 97.99, 110.99, 124.99, 137.99, 150.99, 159.99, 169.99, 179.99, 189.99, // 1-10 Desi
        199.99, 209.99, 219.99, 229.99, 244.98, 264.99, 280.99, 299.99, 315.99, 334.99, // 11-20 Desi
        361.99, 383.99, 410.99, 437.99, 464.99, 491.99, 518.99, 545.99, 572.99, 599.99 // 21-30 Desi
      ]
    },
    yurtici: {
      name: "Yurtiçi Kargo",
      shippingTierFast: [83.33, 113.33],
      shippingTierNormal: [114.16, 119.16],
      prices: [
        121.75, // 0 Desi
        121.75, 121.75, 132.56, 135.41, 157.16, 164.75, 186.34, 193.50, 205.50, 214.59, // 1-10 Desi
        228.48, 242.84, 250.52, 270.13, 284.54, 292.69, 308.96, 324.29, 331.02, 338.15, // 11-20 Desi
        357.33, 368.35, 382.26, 389.91, 416.23, 455.06, 476.59, 498.16, 515.42, 520.70 // 21-30 Desi
      ]
    },
    kolaygelsin: {
      name: "Kolay Gelsin",
      shippingTierFast: [55.83, 86.66],
      shippingTierNormal: [88.33, 93.74],
      prices: [
        96.59, // 0 Desi
        96.59, 96.59, 107.09, 118.64, 128.09, 138.59, 148.04, 158.54, 167.99, 179.54, // 1-10 Desi
        190.04, 201.59, 212.09, 223.64, 235.19, 246.74, 258.29, 269.84, 281.39, 292.94, // 11-20 Desi
        304.49, 316.04, 327.59, 339.14, 350.69, 362.24, 373.79, 385.34, 396.89, 408.44 // 21-30 Desi
      ]
    }
  }
}