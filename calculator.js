export function calculateNormalTierNetProfit(
  salePrice,
  commissionRate,
  productCost,
  productVatRate,
  shippingCompany,
  volumetricWeight,
  consts,
) {
  // Cost
  const fullCommissionCost = salePrice * (commissionRate / 100);
  const fullProductCost = productCost * productVatRate;
  const fullShippingCost =
    salePrice > 349.99 || volumetricWeight > 10
      ? shippingCompany.prices[volumetricWeight] * consts.taxMultiplier
      : salePrice < 200
        ? shippingCompany.shippingTierNormal[0] * consts.taxMultiplier
        : shippingCompany.shippingTierNormal[1] * consts.taxMultiplier;
  const fullTransactionCost =
    consts.transactionFeeTierNormal * consts.taxMultiplier;
  // Vat
  const vatSale = salePrice - salePrice / productVatRate;
  const vatCommission =
    fullCommissionCost - fullCommissionCost / consts.taxMultiplier;
  const vatProduct = fullProductCost - fullProductCost / productVatRate;
  const vatShipping =
    fullShippingCost - fullShippingCost / consts.taxMultiplier;
  const vatTransaction =
    fullTransactionCost - fullTransactionCost / consts.taxMultiplier;
  const totalVat =
    vatSale - vatCommission - vatProduct - vatShipping - vatTransaction;
  // Profit
  const amountToDeposited =
    salePrice - fullCommissionCost - fullShippingCost - fullTransactionCost;
  const netProfit = amountToDeposited - fullProductCost - totalVat;
  const profitRate = (netProfit / salePrice) * 100;
  return {
    fullCommissionCost,
    fullProductCost,
    fullShippingCost,
    fullTransactionCost,
    vatSale,
    vatCommission,
    vatProduct,
    vatShipping,
    vatTransaction,
    totalVat,
    amountToDeposited,
    netProfit,
    profitRate
  };
}
