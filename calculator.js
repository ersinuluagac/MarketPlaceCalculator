export function calculateNetProfit(
  salePrice,
  commissionRate,
  productCost,
  productVatRate,
  shippingCompany,
  volumetricWeight,
  consts,
) {
  //// Costs
  const fullCommissionCost = salePrice * (commissionRate / 100);
  const fullProductCost = productCost * productVatRate;
  // Cargo
  const fullNormalShippingCost =
    salePrice > 349.99 || volumetricWeight > 10
      ? shippingCompany.prices[volumetricWeight] * consts.taxMultiplier
      : salePrice < 200
        ? shippingCompany.shippingTierNormal[0] * consts.taxMultiplier
        : shippingCompany.shippingTierNormal[1] * consts.taxMultiplier;
  const fullFastShippingCost =
    salePrice > 349.99 || volumetricWeight > 10
      ? fullNormalShippingCost
      : salePrice < 200
        ? shippingCompany.shippingTierFast[0] * consts.taxMultiplier
        : shippingCompany.shippingTierFast[1] * consts.taxMultiplier;
  // Transaction
  const fullNormalTransactionCost =
    consts.transactionFeeTierNormal * consts.taxMultiplier;
  const fullFastTransactionCost =
    consts.transactionFeeTierFast * consts.taxMultiplier;
  //// VATs
  const vatSale = salePrice - salePrice / productVatRate;
  const vatCommission =
    fullCommissionCost - fullCommissionCost / consts.taxMultiplier;
  const vatProduct = fullProductCost - fullProductCost / productVatRate;
  // Cargo
  const vatNormalShipping =
    fullNormalShippingCost - fullNormalShippingCost / consts.taxMultiplier;
  const vatFastShipping =
    fullFastShippingCost - fullFastShippingCost / consts.taxMultiplier;
  // Transaction
  const vatNormalTransaction =
    fullNormalTransactionCost -
    fullNormalTransactionCost / consts.taxMultiplier;
  const vatFastTransaction =
    fullFastTransactionCost - fullFastTransactionCost / consts.taxMultiplier;
  //// Profit
  // Total VATs
  const totalVatNormal =
    vatSale -
    vatCommission -
    vatProduct -
    vatNormalShipping -
    vatNormalTransaction;
  const totalVatFast =
    vatSale -
    vatCommission -
    vatProduct -
    vatFastShipping -
    vatNormalTransaction;
  const totalVatToday =
    vatSale - vatCommission - vatProduct - vatFastShipping - vatFastTransaction;
  // Amounts To Deposit
  const amountToDepositedNormal =
    salePrice -
    fullCommissionCost -
    fullNormalShippingCost -
    fullNormalTransactionCost;
  const amountToDepositedFast =
    salePrice -
    fullCommissionCost -
    fullFastShippingCost -
    fullNormalTransactionCost;
  const amountToDepositedToday =
    salePrice -
    fullCommissionCost -
    fullFastShippingCost -
    fullFastTransactionCost;
  // Net Profits
  const netProfitNormal =
    amountToDepositedNormal - fullProductCost - totalVatNormal;
  const netProfitFast = amountToDepositedFast - fullProductCost - totalVatFast;
  const netProfitToday =
    amountToDepositedToday - fullProductCost - totalVatToday;
  // Profit Rates
  const profitRateNormal = (netProfitNormal / salePrice) * 100;
  const profitRateFast = (netProfitFast / salePrice) * 100;
  const profitRateToday = (netProfitToday / salePrice) * 100;
  return {
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

    profitRateNormal,
    profitRateFast,
    profitRateToday,
  };
}
