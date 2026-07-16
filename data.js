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
    transactionFeeTierFast: 6.99,
    transactionFeeTierNormal: 10.99,
  },
  // Firmalar ve Fiyatlar
  /*
    Not: Desi bilgisi ve index eşittir.
  */
  companies: {
    tex: {
      name: "Trendyol Express",
      shippingTierFast: [34.16, 65.83],
      shippingTierNormal: [64.58, 72.91],
      prices: [
        77.54, // 0 Desi
        77.54, 77.54, 93.63, 101.46, 107.98, 118.30, 125.66, 134.21, 142.42, 153.47, // 1-10 Desi
        162.13, 170.33, 178.04, 185.17, 192.81, 200.82, 209.70, 218.60, 227.46, 236.21, // 11-20 Desi
        244.98, 254.82, 264.97, 274.36, 283.69, 292.73, 301.77, 310.84, 319.89, 328.88 // 21-30 Desi
      ]
    },
    aras: {
      name: "Aras Kargo",
      shippingTierFast: [42.91, 73.74],
      shippingTierNormal: [71.66, 79.99],
      prices: [
        88.96, // 0 Desi
        88.96, 88.96, 100.84, 109.90, 117.85, 128.39, 136.17, 145.27, 153.60, 164.23, // 1-10 Desi
        173.09, 179.47, 187.61, 194.84, 202.03, 213.36, 224.62, 235.95, 247.24, 252.09, // 11-20 Desi
        264.80, 276.40, 287.97, 298.26, 308.50, 322.85, 335.94, 347.66, 361.09, 371.34 // 21-30 Desi
      ]
    },
    ptt: {
      name: "PTT",
      shippingTierFast: [34.16, 65.83],
      shippingTierNormal: [64.58, 72.91],
      prices: [
        77.54, // 0 Desi
        77.54, 77.54, 96.00, 96.00, 100.55, 106.83, 113.15, 125.73, 138.34, 157.26, // 1-10 Desi
        165.01, 173.31, 181.63, 189.94, 198.22, 206.52, 214.83, 223.13, 231.45, 239.76, // 11-20 Desi
        248.06, 256.36, 264.66, 272.95, 281.27, 289.58, 297.88, 306.18, 314.48, 322.78 // 21-30 Desi
      ]
    },
    surat: {
      name: "Sürat Kargo",
      shippingTierFast: [48.74, 79.58],
      shippingTierNormal: [77.49, 85.83],
      prices: [
        95.54, // 0 Desi
        95.54, 95.54, 106.45, 116.40, 122.41, 134.48, 143.61, 152.60, 161.73, 170.86, // 1-10 Desi
        182.99, 193.34, 201.11, 206.02, 213.51, 220.73, 232.45, 244.17, 255.75, 267.46, // 11-20 Desi
        279.46, 290.36, 300.98, 311.75, 322.37, 332.73, 343.09, 353.45, 363.79, 374.15 // 21- 30 Desi
      ]
    },
    dhl: {
      name: "DHL eCommerce",
      shippingTierFast: [52.08, 82.91],
      shippingTierNormal: [80.83, 89.16],
      prices: [
        97.99, // 0 Desi
        97.99, 97.99, 110.99, 124.99, 137.99, 150.99, 159.99, 169.99, 179.99, 189.99, // 1-10 Desi
        199.99, 209.99, 219.99, 229.99, 244.98, 264.99, 280.99, 299.99, 315.99, 334.99, // 11-20 Desi
        361.99, 383.99, 410.99, 437.99, 464.99, 491.99, 518.99, 545.99, 572.99, 599.99 // 21-30 Desi
      ]
    },
    yurtici: {
      name: "Yurtiçi Kargo",
      shippingTierFast: [74.58, 104.58],
      shippingTierNormal: [101.24, 109.58],
      prices: [
        121.75, // 0 Desi
        121.75, 121.75, 132.56, 135.41, 157.16, 164.75, 186.34, 193.50, 205.50, 214.59, // 1-10 Desi
        228.48, 242.84, 250.52, 270.13, 284.54, 292.69, 308.96, 324.29, 331.02, 338.15, // 11-20 Desi
        357.33, 368.35, 382.26, 389.91, 416.23, 455.06, 476.59, 498.16, 515.42, 520.70 // 21-30 Desi
      ]
    },
    kolaygelsin: {
      name: "Kolay Gelsin",
      shippingTierFast: [51.24, 82.08],
      shippingTierNormal: [79.58, 87.91],
      prices: [
        96.59, // 0 Desi
        96.59, 96.59, 107.09, 118.64, 128.09, 138.59, 148.04, 158.54, 167.99, 179.54, // 1-10 Desi
        190.04, 201.59, 212.09, 223.64, 235.19, 246.74, 258.29, 269.84, 281.39, 292.94, // 11-20 Desi
        304.49, 316.04, 327.59, 339.14, 350.69, 362.24, 373.79, 385.34, 396.89, 408.44 // 21-30 Desi
      ]
    }
  }
}