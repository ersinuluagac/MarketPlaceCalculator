export function calculateNormalTierNetProfit(
  salePrice,
  commissionRate,
  productCost,
  productVatRate,
  shippingCompany,
  volumetricWeight,
  consts,
) {
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
  const totalVat =
    (salePrice - (salePrice / productVatRate)) -
    (fullCommissionCost - (fullCommissionCost / consts.taxMultiplier)) -
    (fullProductCost - (fullProductCost / productVatRate)) -
    (fullShippingCost - (fullShippingCost / consts.taxMultiplier)) -
    (fullTransactionCost - (fullTransactionCost / consts.taxMultiplier));
  return {
    fullCommissionCost,
    fullProductCost,
    fullShippingCost,
    fullTransactionCost,
    totalVat
  };
}
