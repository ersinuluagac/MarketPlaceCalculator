export function calculateNetProfit(
  salePrice,
  commissionRate,
  productCost,
  productVatRate,
  shippingCompany,
  volumetricWeight,
  consts,
) {
  //// Shipping Type
  const shippingType =
    salePrice >= 350 || volumetricWeight > 10
      ? "Normal"
      : salePrice >= 200
        ? "Üst Barem"
        : "Alt Barem";
  //// Costs
  const fullCommissionCost = salePrice * (commissionRate / 100);
  const fullProductCost = (productCost * productVatRate).toFixed(2);
  // Cargo
  const fullNormalShippingCost =
    salePrice > 349.99 || volumetricWeight > 10
      ? (shippingCompany.prices[volumetricWeight] * consts.taxMultiplier).toFixed(2)
      : salePrice < 200
        ? (shippingCompany.shippingTierNormal[0] * consts.taxMultiplier).toFixed(2)
        : (shippingCompany.shippingTierNormal[1] * consts.taxMultiplier).toFixed(2);
  const fullFastShippingCost =
    salePrice > 349.99 || volumetricWeight > 10
      ? fullNormalShippingCost
      : salePrice < 200
        ? (shippingCompany.shippingTierFast[0] * consts.taxMultiplier).toFixed(2)
        : (shippingCompany.shippingTierFast[1] * consts.taxMultiplier).toFixed(2);
  // Transaction
  const fullNormalTransactionCost =
    (consts.transactionFeeTierNormal * consts.taxMultiplier).toFixed(2);
  const fullFastTransactionCost =
    (consts.transactionFeeTierFast * consts.taxMultiplier).toFixed(2);
  //// VATs
  const vatSale = (salePrice - salePrice / productVatRate).toFixed(2);
  const vatCommission =
    (fullCommissionCost - fullCommissionCost / consts.taxMultiplier).toFixed(2);
  const vatProduct = (fullProductCost - fullProductCost / productVatRate).toFixed(2);
  // Cargo
  const vatNormalShipping =
    (fullNormalShippingCost - fullNormalShippingCost / consts.taxMultiplier).toFixed(2);
  const vatFastShipping =
    (fullFastShippingCost - fullFastShippingCost / consts.taxMultiplier).toFixed(2);
  // Transaction
  const vatNormalTransaction =
    (fullNormalTransactionCost -
    fullNormalTransactionCost / consts.taxMultiplier).toFixed(2);
  const vatFastTransaction =
    (fullFastTransactionCost - fullFastTransactionCost / consts.taxMultiplier).toFixed(2);
  //// Profit
  // Total VATs
  const totalVatNormal = (
    vatSale -
    vatCommission -
    vatProduct -
    vatNormalShipping -
    vatNormalTransaction
  ).toFixed(2);
  const totalVatFast = (
    vatSale -
    vatCommission -
    vatProduct -
    vatFastShipping -
    vatNormalTransaction
  ).toFixed(2);
  const totalVatToday = (
    vatSale -
    vatCommission -
    vatProduct -
    vatFastShipping -
    vatFastTransaction
  ).toFixed(2);
  // Amounts To Deposit
  const amountToDepositedNormal = (
    salePrice -
    fullCommissionCost -
    fullNormalShippingCost -
    fullNormalTransactionCost
  ).toFixed(2);
  const amountToDepositedFast = (
    salePrice -
    fullCommissionCost -
    fullFastShippingCost -
    fullNormalTransactionCost
  ).toFixed(2);
  const amountToDepositedToday = (
    salePrice -
    fullCommissionCost -
    fullFastShippingCost -
    fullFastTransactionCost
  ).toFixed(2);
  // Net Profits
  const netProfitNormal = (
    amountToDepositedNormal -
    fullProductCost -
    totalVatNormal
  ).toFixed(2);
  const netProfitFast = (
    amountToDepositedFast -
    fullProductCost -
    totalVatFast
  ).toFixed(2);
  const netProfitToday = (
    amountToDepositedToday -
    fullProductCost -
    totalVatToday
  ).toFixed(2);
  // Profit Margin
  const profitMarginNormal = ((netProfitNormal / salePrice) * 100).toFixed(2);
  const profitMarginFast = ((netProfitFast / salePrice) * 100).toFixed(2);
  const profitMarginToday = ((netProfitToday / salePrice) * 100).toFixed(2);
  // ROI
  const roiNormal = ((netProfitNormal / fullProductCost) * 100).toFixed(2);
  const roiFast = ((netProfitFast / fullProductCost) * 100).toFixed(2);
  const roiToday = ((netProfitToday / fullProductCost) * 100).toFixed(2);
  return {
    shippingType,
    salePrice,
    commissionRate,
    // Costs
    fullCommissionCost,
    fullProductCost,
    // Cargo
    fullNormalShippingCost,
    fullFastShippingCost,
    // Transaction
    fullNormalTransactionCost,
    fullFastTransactionCost,
    // VATs
    vatSale,
    vatCommission,
    vatProduct,
    // Cargos
    vatNormalShipping,
    vatFastShipping,
    // Transaction
    vatNormalTransaction,
    vatFastTransaction,
    // Profit
    totalVatNormal,
    totalVatFast,
    totalVatToday,

    amountToDepositedNormal,
    amountToDepositedFast,
    amountToDepositedToday,

    netProfitNormal,
    netProfitFast,
    netProfitToday,

    profitMarginNormal,
    profitMarginFast,
    profitMarginToday,

    roiNormal,
    roiFast,
    roiToday
  };
}
